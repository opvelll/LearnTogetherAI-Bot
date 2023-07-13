import { Message, TextChannel } from "discord.js";
import { ChannelHandler } from "./ChannelHandler";
import { PineconeManager } from "../Pinecone/PineconeManager";

import logger from "../logger";
import {
  fetchUserAndBotMessages,
  transformHistoryToRequestMessages,
} from "./Service/chatHistoryProcessor";
import { OpenAIManager } from "../OpenAI/OpenAIManager";

export class IntroductionsChannelHandler implements ChannelHandler {
  private openAIManager: OpenAIManager;
  private pineconeManager: PineconeManager;
  constructor(openAIManager: OpenAIManager, pineconeManager: PineconeManager) {
    this.openAIManager = openAIManager;
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

      const responseMessage = await this.openAIManager.chatCompletion(
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
