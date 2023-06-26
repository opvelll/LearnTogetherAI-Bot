import { Message } from "discord.js";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";
import { ChannelHandler } from "./GreetingChannelHandler";
import { PineconeClient } from "@pinecone-database/pinecone";

type MetadataObj = {
  channelId: string;
  content: string;
  author: string;
  createdAt: number;
};

export class SearchChannelHandler implements ChannelHandler {
  private openAIProcessor: OpenAIProcessor;
  private pinecone: PineconeClient;
  private pineconeIndexName: string;

  constructor(openAIProcessor: OpenAIProcessor, pinecone: PineconeClient) {
    this.openAIProcessor = openAIProcessor;
    this.pinecone = pinecone;
    if (process.env.PINECONE_INDEX_NAME === undefined) {
      throw new Error("環境変数PINECONE_INDEX_NAMEが設定されていません。");
    }
    this.pineconeIndexName = process.env.PINECONE_INDEX_NAME;
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
  private async processMessageAndRespond(message: Message) {
    try {
      // OpenAIのAPIから埋め込みを取得します。
      const embedding = await this.openAIProcessor.createEmbedding([
        message.content,
      ]);

      // Pineconeのインデックスにアクセスします
      const index = this.pinecone.Index(this.pineconeIndexName);

      // Pineconeにデータをアップサートします。
      const upsertRequest = {
        vectors: [
          {
            id: message.id,
            values: embedding,
            metadata: {
              channelId: process.env.CHANNEL_ID_SEARCH,
              content: message.content,
              author: message.author.id,
              createdAt: this.toUnixTimeStampAtDayLevel(message.createdAt), // 種類が少ないほうがメモリが少なくなるそうなので、日付のみを保存する
            },
          },
        ],
        namespace: "self-introduction",
      };
      await index.upsert({ upsertRequest });

      // 類似の埋め込みをPineconeで検索します。
      const queryRequest = {
        vector: embedding,
        topK: 3,
        includeMetadata: true,
        filter: {
          author: { $ne: message.author.id },
        },
        namespace: "self-introduction",
      };
      const queryResponse = await index.query({
        queryRequest,
      });
      console.log(queryResponse);

      // クエリの応答からコンテキストを作成します。
      const context = queryResponse.matches?.map((match) => {
        const { author, content, createdAt } = match.metadata as MetadataObj;
        return [author, content, new Date(createdAt)];
      }) as [string, string, Date][];

      // OpenAIのGPTを使用して応答を生成します。
      const gptResponse =
        await this.openAIProcessor.chatCompletionFromUserIntroduction(
          message.author.id,
          message.content,
          context
        );

      // 生成された応答をメッセージに返信として送信します。
      message.reply(gptResponse);
    } catch (error) {
      console.error("Error processing the message:", error);
    }
  }

  /**
  
  Handle incoming messages.
  @param message The message to be handled.
  */
  public handle(message: Message): void {
    this.processMessageAndRespond(message);
  }
}
