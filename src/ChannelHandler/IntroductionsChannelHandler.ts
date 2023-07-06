import { Message } from "discord.js";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";
import { ChannelHandler } from "./GreetingChannelHandler";
import { PineconeManager } from "../Pinecone/PineconeManager";
import { MetadataObj } from "../Pinecone/MetadataObj";
import { toUnixTimeStampAtDayLevel } from "../Pinecone/dateUtils";
import logger from "../logger";

export class IntroductionsChannelHandler implements ChannelHandler {
  private openAIProcessor: OpenAIProcessor;
  private pineconeManager: PineconeManager;
  constructor(
    openAIProcessor: OpenAIProcessor,
    pineconeManager: PineconeManager
  ) {
    this.openAIProcessor = openAIProcessor;
    this.pineconeManager = pineconeManager;
  }

  async process(message: Message): Promise<void> {
    try {
      const embedding = await this.openAIProcessor.createEmbedding([
        message.content,
      ]);

      const metadata: MetadataObj = {
        channelId: message.channel.id,
        content: message.content,
        author: message.author.id,
        createdAt: toUnixTimeStampAtDayLevel(message.createdAt),
      };

      await this.pineconeManager.upsertData(
        message.id,
        embedding,
        metadata,
        `self-introduction`
      );

      this.openAIProcessor
        .chatCompletionFromIntroduction(message.content)
        .then((response) => {
          message.reply(response);
        });
    } catch (error) {
      logger.error(error, "Error processing the introduction Channel message:");
      await message.reply("Error processing the message.");
    }
  }

  handle(message: Message): void {
    // チャンネル1での処理
    this.process(message);
  }
}
