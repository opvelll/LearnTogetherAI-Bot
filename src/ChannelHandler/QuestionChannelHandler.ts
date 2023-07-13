import { Message, TextChannel } from "discord.js";
import { ChannelHandler } from "./ChannelHandler";
import logger from "../logger";
import {
  fetchMessagesWithinTokenLimit,
  fetchUserAndBotMessages,
} from "./Service/chatHistoryProcessor";
import { ChatCompletionRequestMessage } from "openai";
import { OpenAIManager } from "../OpenAI/OpenAIManager";

const MAX_TOKENS = 3000;

export class QuestionChannelHandler implements ChannelHandler {
  private chatManager: OpenAIManager;

  constructor(chatManager: OpenAIManager) {
    this.chatManager = chatManager;
  }

  async chatCompletionFromQuestionWithChannelHistory(
    messages: Message<boolean>[]
  ) {
    const todayDate = new Date().toLocaleDateString();
    const systemPrompt = `
貴方はAI勉強会会場にいる想像力豊かで、色々なことに興味を持つ良き相談役です。
ユーザーの質問に簡潔に答えてください。
今日の日付は${todayDate}です。`;

    const messagesFromChannelHistory = messages.map((message) => {
      if (message.author.bot) {
        return {
          role: "assistant",
          content: message.content,
        };
      } else {
        return {
          role: "user",
          content: message.content,
        };
      }
    });
    const prompts = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messagesFromChannelHistory,
    ] as ChatCompletionRequestMessage[];
    return await this.chatManager.chatCompletion(prompts);
  }

  async processMessageForChannel(message: Message) {
    try {
      // チャンネルを取得
      const channel = message.channel as TextChannel;

      // MAX_TOKENSトークンを超えないメッセージのリストを取得
      const list = await fetchUserAndBotMessages(10, message);

      const response = await this.chatCompletionFromQuestionWithChannelHistory(
        list
      );
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
