import { Message, TextChannel } from "discord.js";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";
import { ChannelHandler } from "./ChannelHandler";
import { PineconeManager } from "../Pinecone/PineconeManager";

import logger from "../logger";
import {
  fetchMessagesWithinTokenLimit,
  fetchUserAndBotMessages,
  transformHistoryToRequestMessages,
} from "./Service/chatHistoryProcessor";

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
  private systemPrompt = `
貴方の名前はTogetherAIBotで、勉強会で来た人たちの自己紹介を聞いてそれにあったもくもく会での勉強の仕方を簡単、簡潔に提案して下さい。
ユーザー名を書く場合は、<@userId>のように書いて下さい。<@123456>のように。
`;

  async processMessage(message: Message): Promise<void> {
    try {
      // ユーザーとボットの会話メッセージを取得する
      const messageList = await fetchUserAndBotMessages(10, message);
      const requestMessages = transformHistoryToRequestMessages(
        this.systemPrompt,
        messageList
      );

      const responseMessage =
        await this.openAIProcessor.chatCompletionClient.chatCompletion(
          requestMessages
        );
      await message.reply(responseMessage.content!);
    } catch (error) {
      logger.error(error, "Error processing the introduction Channel message:");
      await message.reply("Error processing the message.");
    }
  }

  handle(message: Message): void {
    // チャンネル1での処理
    this.processMessage(message);
  }
}
