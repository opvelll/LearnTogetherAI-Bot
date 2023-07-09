import { Message, TextChannel } from "discord.js";
import { ChannelHandler } from "./ChannelHandler";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";
import logger from "../logger";
import { fetchMessagesWithinTokenLimit } from "./chatHistoryProcessor";

const MAX_TOKENS = 3000;

export class QuestionChannelHandler implements ChannelHandler {
  private chatManager: OpenAIProcessor;

  constructor(chatManager: OpenAIProcessor) {
    this.chatManager = chatManager;
  }

  async processMessageForChannel(message: Message) {
    try {
      // チャンネルを取得
      const channel = message.channel as TextChannel;

      // MAX_TOKENSトークンを超えないメッセージのリストを取得
      const list = await fetchMessagesWithinTokenLimit(
        100,
        MAX_TOKENS,
        channel
      );

      const response =
        await this.chatManager.chatCompletionFromQuestionWithChannelHistory(
          list
        );
      await message.reply(response);
    } catch (error) {
      logger.error(error, "Error processing message for question channel: ");
      // errorが発生した場合はエラーメッセージを返す
      await message.reply("An error occurred while processing your message.");
    }
  }

  handle(message: Message): void {
    this.processMessageForChannel(message);
  }
}
