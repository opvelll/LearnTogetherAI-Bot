import { Message } from "discord.js";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";
import { ChannelHandler } from "./GreetingChannelHandler";
import { PineconeClient } from "@pinecone-database/pinecone";
import logger from "../logger";
import {
  QueryResponse,
  VectorOperationsApi,
} from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import { PineconeManager } from "../Pinecone/PineconeManager";

type MetadataObj = {
  channelId: string;
  content: string;
  author: string;
  createdAt: number;
};

export class SearchChannelHandler implements ChannelHandler {
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
   * Dateオブジェクトを日レベルのUNIXタイムスタンプに変換します（時間は00:00:00に設定されます）。
   * @param date 変換する日付。
   * @returns 日レベルのUNIXタイムスタンプ。
   */
  private toUnixTimeStampAtDayLevel(date: Date): number {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    return normalizedDate.getTime();
  }

  /**
   * メッセージを処理し、検索を実行し、応答を送信します。
   * @param message 処理するメッセージ。
   */
  private async processMessageAndRespond(message: Message): Promise<void> {
    try {
      // OpenAIのAPIから埋め込みを取得します。
      const embedding = await this.getEmbedding(message);

      // Pineconeにデータをアップサートします。
      const metadata = {
        channelId: message.channel.id,
        content: message.content,
        author: message.author.id,
        createdAt: this.toUnixTimeStampAtDayLevel(message.createdAt), // 種類が少ないほうがメモリが少なくなるそうなので、日付のみを保存する
      };
      await this.pineconeManager.upsertData(message.id, embedding, metadata);

      // 類似の埋め込みをPineconeで検索します。
      const queryResponse = await this.pineconeManager.querySimilarEmbeddings(
        embedding,
        message.author.id
      );

      // クエリの応答からコンテキストを作成します。
      const context = this.buildContextFromQueryResponse(queryResponse);

      // OpenAIのGPTを使用して応答を生成します。
      const gptResponse = await this.generateGptResponse(message, context);

      // 生成された応答をメッセージに返信として送信します。
      await message.reply(gptResponse);
    } catch (error) {
      logger.error(error, "Error processing the Search Channel message:");
      await message.reply("Error processing the message.");
    }
  }

  private async generateGptResponse(
    message: Message<boolean>,
    context: [string, string, Date][]
  ) {
    return await this.openAIProcessor.chatCompletionFromUserIntroduction(
      message.author.id,
      message.content,
      context
    );
  }

  private buildContextFromQueryResponse(queryResponse: QueryResponse) {
    return queryResponse.matches?.map((match) => {
      const { author, content, createdAt } = match.metadata as MetadataObj;
      return [author, content, new Date(createdAt)];
    }) as [string, string, Date][];
  }

  private async getEmbedding(message: Message<boolean>) {
    const embedding = await this.openAIProcessor.createEmbedding([
      message.content,
    ]);
    logger.info("openAI api embedding");
    return embedding;
  }

  /**
  
  Handle incoming messages.
  @param message The message to be handled.
  */
  public handle(message: Message): void {
    this.processMessageAndRespond(message);
  }
}
