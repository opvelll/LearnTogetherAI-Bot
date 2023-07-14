import { Message } from "discord.js";
import { PineconeManager } from "../../Pinecone/PineconeManager";
import { MetadataObj } from "../../Pinecone/MetadataObj";
import { toUnixTimeStampAtDayLevel } from "../../Pinecone/dateUtils";
import { OpenAIManager } from "../../OpenAI/OpenAIManager";

export class UserEmbeddingManager {
  private openAIManager: OpenAIManager;
  private pineconeManager: PineconeManager;
  constructor(openAIManager: OpenAIManager, pineconeManager: PineconeManager) {
    this.openAIManager = openAIManager;
    this.pineconeManager = pineconeManager;
  }

  // ユーザー情報を保存する
  private async saveUserInformation(
    message: Message<boolean>,
    content: string
  ) {
    const embedding = await this.openAIManager.createEmbedding([
      message.content,
    ]);

    const metadata: MetadataObj = {
      channelId: message.channel.id,
      content: content,
      author: message.author.id,
      createdAt: toUnixTimeStampAtDayLevel(message.createdAt),
    };

    await this.pineconeManager.upsertData(
      message.author.id, // message.author.id で一人一つにする。
      embedding,
      metadata
    );
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
