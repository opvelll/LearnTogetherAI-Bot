import { Message } from "discord.js";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";
import { ChannelHandler } from "./GreetingChannelHandler";
import logger from "../logger";
import { QueryResponse } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import { PineconeManager } from "../Pinecone/PineconeManager";
import { ChatCompletionResponseMessage } from "openai";
import { toUnixTimeStampAtDayLevel } from "../Pinecone/dateUtils";
import { MetadataObj } from "../Pinecone/MetadataObj";

export class WorkPlanChannelHandler implements ChannelHandler {
  private openAIProcessor: OpenAIProcessor;
  private pineconeManager: PineconeManager;

  constructor(
    openAIProcessor: OpenAIProcessor,
    pineconeManager: PineconeManager
  ) {
    this.openAIProcessor = openAIProcessor;
    this.pineconeManager = pineconeManager;
  }

  /**
   * Fetches an embedding for the message from the OpenAI API.
   * @param message The message to be processed.
   * @returns The embedding.
   */
  private async getEmbedding(message: Message): Promise<any> {
    return this.openAIProcessor.createEmbedding([message.content]);
  }

  /**
   * Builds context from the query response.
   * @param queryResponse The response from the query.
   * @returns The context.
   */
  private buildContextFromQueryResponse(
    queryResponse: QueryResponse
  ): [string, string, Date][] {
    return queryResponse.matches!.map((match) => {
      const { author, content, createdAt } = match.metadata as MetadataObj;
      return [author, content, new Date(createdAt)];
    });
  }

  /**
   * Generates a response using GPT.
   * @param message The input message.
   * @param context The context for generating a response.
   * @returns The generated response.
   */
  private async generateGptResponse(
    message: Message,
    context: [string, string, Date][]
  ): Promise<ChatCompletionResponseMessage> {
    return this.openAIProcessor.chatCompletionFromUserWorkPlan(
      message.author.id,
      message.content,
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
