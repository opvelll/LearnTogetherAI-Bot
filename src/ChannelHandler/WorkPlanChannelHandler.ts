import { Message } from "discord.js";
import { ChannelHandler } from "./ChannelHandler";
import logger from "../logger";
import { QueryResponse } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import { PineconeManager } from "../Pinecone/PineconeManager";
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
} from "openai";
import { toUnixTimeStampAtDayLevel } from "../Pinecone/dateUtils";
import { MetadataObj } from "../Pinecone/MetadataObj";
import { OpenAIManager } from "../OpenAI/OpenAIManager";

export class WorkPlanChannelHandler implements ChannelHandler {
  private openAIManager: OpenAIManager;
  private pineconeManager: PineconeManager;

  constructor(openAIManager: OpenAIManager, pineconeManager: PineconeManager) {
    this.openAIManager = openAIManager;
    this.pineconeManager = pineconeManager;
  }

  private buildContextPrompt(context: MetadataObj[]): string {
    return context
      .map(
        ({ author, content, createdAt }) =>
          `
---
date: ${new Date(createdAt).toLocaleDateString()} 
userId: ${author} 
${content}
---`
      )
      .join("\n");
  }

  async chatCompletionFromUserWorkPlan(
    userId: string,
    userInput: string,
    systemPrompt: string,
    context: MetadataObj[]
  ) {
    const contextPrompt = this.buildContextPrompt(context);

    const prompts = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `
userId: ${userId}
${userInput} 

[システムからの挿入: 以下を参考に]:
${contextPrompt} 

`,
      },
    ] as ChatCompletionRequestMessage[];
    return await this.openAIManager.chatCompletion(prompts);
  }

  /**
   * Fetches an embedding for the message from the OpenAI API.
   * @param message The message to be processed.
   * @returns The embedding.
   */
  private async getEmbedding(message: Message): Promise<any> {
    return this.openAIManager.createEmbedding([message.content]);
  }

  /**
   * Builds context from the query response.
   * @param queryResponse The response from the query.
   * @returns The context.
   */
  private buildContextFromQueryResponse(
    queryResponse: QueryResponse
  ): MetadataObj[] {
    return queryResponse.matches!.map((match) => match.metadata as MetadataObj);
  }

  /**
   * Generates a response using GPT.
   * @param message The input message.
   * @param context The context for generating a response.
   * @returns The generated response.
   */
  private async generateGptResponse(
    message: Message,
    context: MetadataObj[]
  ): Promise<ChatCompletionResponseMessage> {
    const systemPrompt = `
ユーザーの発言とその発言に近いユーザー情報を貼ります。
この情報を必要なら使い、もくもく会での共有、つながり、学習を促して下さい。
ユーザー名を書く場合は、<@userId>のようにしてください。

例:
userId: 349671279076311060
こんにちは、AAです。よろしくお願いします。今日はUnityでゲームを作ります。

[システムの挿入]
userId: 397363536571138049
よろしくBBです。今日はシェーダープログラミングの勉強をします。

...

こんにちは<@349671279076311060>さん。Unityを使ったゲームづくりに興味があるのですね！
他の参加者の自己紹介情報を見ると、<@397363536571138049>さんがシェーダープログラミングの勉強をしています。
よろしければ、情報を交換してみてはいかがでしょうか？よいもくもく勉強会になりますように！
`;
    return this.chatCompletionFromUserWorkPlan(
      message.author.id,
      message.content,
      systemPrompt,
      context
    );
  }

  /**
   * Processes an incoming message, performs a search, and sends a response.
   * @param message The message to be processed.
   */
  private async processMessageAndRespond(message: Message): Promise<void> {
    try {
      const embedding = await this.getEmbedding(message);

      const metadata: MetadataObj = {
        channelId: message.channel.id,
        content: message.content,
        author: message.author.id,
        createdAt: toUnixTimeStampAtDayLevel(message.createdAt),
      };

      await this.pineconeManager.upsertData(message.id, embedding, metadata);

      const queryResponse = await this.pineconeManager.querySimilarEmbeddings(
        embedding,
        message.author.id
      );

      const context = this.buildContextFromQueryResponse(queryResponse);

      const gptResponse = await this.generateGptResponse(message, context);

      await message.reply(gptResponse);
    } catch (error) {
      logger.error(error, "Error processing the Work Plan Channel message:");
      await message.reply("Error processing the message.");
    }
  }

  /**
  
  Handles incoming messages.
  @param message The message to be handled.
  */
  public handle(message: Message): void {
    this.processMessageAndRespond(message);
  }
}
