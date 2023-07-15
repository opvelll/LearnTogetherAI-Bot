import { Message } from "discord.js";
import { ChannelHandler } from "./ChannelHandler";
import logger from "../logger";
import {
  fetchConversationsWithTokenLimit,
  transformHistoryToRequestMessages,
} from "./Service/chatHistoryProcessor";
import { OpenAIManager } from "../OpenAI/OpenAIManager";

export class QuestionChannelHandler implements ChannelHandler {
  private chatManager: OpenAIManager;
  MAX_TOKENS = 3000;

  constructor(chatManager: OpenAIManager) {
    this.chatManager = chatManager;
  }

  async processMessageForChannel(message: Message) {
    try {
      // メッセージを取得する
      const list = await fetchConversationsWithTokenLimit(
        15,
        this.MAX_TOKENS,
        message
      );

      const todayDate = new Date().toLocaleDateString();
      const systemPrompt = `
貴方はAI勉強会会場にいる想像力豊かで、色々なことに興味を持つ良き相談役です。
ユーザーの質問に簡潔に答えてください。
今日の日付は${todayDate}です。`;

      const messageList = transformHistoryToRequestMessages(
        systemPrompt,
        list,
        false
      );
      const response = await this.chatManager.chatCompletion(messageList);

      await message.reply(response);
    } catch (error) {
      logger.error(error, "Error processing message for question channel: ");
      // errorが発生した場合はエラーメッセージを返す
      await message.reply("An error occurred while processing your message.");
    }
  }

  async handle(message: Message) {
    await this.processMessageForChannel(message);
  }
}
