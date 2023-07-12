import { Message } from "discord.js";
import OpenAIProcessor from "../../OpenAIProcessor/OpenAIProcessor";
import { PineconeManager } from "../../Pinecone/PineconeManager";
import { MetadataObj } from "../../Pinecone/MetadataObj";
import { toUnixTimeStampAtDayLevel } from "../../Pinecone/dateUtils";

export class UserEmbeddingManager {
  private openAIProcessor: OpenAIProcessor;
  private pineconeManager: PineconeManager;
  constructor(
    openAIProcessor: OpenAIProcessor,
    pineconeManager: PineconeManager
  ) {
    this.openAIProcessor = openAIProcessor;
    this.pineconeManager = pineconeManager;
  }

  // ユーザー情報を保存する
  private async saveUserInformation(
    message: Message<boolean>,
    content: string
  ) {
    const embedding = await this.openAIProcessor.createEmbedding([
      message.content,
    ]);

    const metadata: MetadataObj = {
      channelId: message.channel.id,
      content: content,
      author: message.author.id,
      createdAt: toUnixTimeStampAtDayLevel(message.createdAt),
    };

    await this.pineconeManager.upsertData(message.id, embedding, metadata); // message.idをuuidのように使う
    return embedding;
  }

  // 似たユーザーを取得する
  private async getSimilarUsers(
    embedding: number[],
    message: Message<boolean>
  ) {
    const queryResponse = await this.pineconeManager.querySimilarEmbeddings(
      embedding,
      message.author.id
    );

    return queryResponse.matches!.map((match) => {
      const { author, content, createdAt } = match.metadata as MetadataObj;
      return { userId: author, content: content, createdAt: createdAt };
    });
  }

  async upsertAndGetSimilarUsers(message: Message, content: string) {
    const embedding = await this.saveUserInformation(message, content);

    return await this.getSimilarUsers(embedding, message);
  }
}
