import { Message, TextChannel } from "discord.js";
import { ChannelHandler } from "./GreetingChannelHandler";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";
import { get_encoding } from "@dqbd/tiktoken";
import logger from "../logger";

const MAX_TOKENS = 3000;

export class QuestionChannelHandler implements ChannelHandler {
  private chatManager: OpenAIProcessor;

  constructor(chatManager: OpenAIProcessor) {
    this.chatManager = chatManager;
  }

  /**
   * Tiktokenを使用してテキスト文字列のトークンの長さを計算します。
   * @param text トークン化するテキスト。
   * @returns トークンの数。
   */
  private tiktokenLength(text: string): number {
    const tokenizer = get_encoding("cl100k_base");
    const tokens = tokenizer.encode(text);
    tokenizer.free();
    return tokens.length;
  }

  async getMessages(channel: TextChannel) {
    // 最新の100件のメッセージを取得
    const messages = await channel.messages.fetch({ limit: 100 });

    let totalTokens = 0;
    const messageList: Message[] = [];

    // 新しいメッセージから順に処理
    for (let [key, message] of messages.reverse()) {
      const estimatedTokens = this.tiktokenLength(message.content);

      // トークン数がMAX_TOKENSを超える場合、処理を停止
      if (totalTokens + estimatedTokens > MAX_TOKENS) {
        break;
      }

      totalTokens += estimatedTokens;
      messageList.push(message);
    }

    // トークン数がMAX_TOKENSを超えないメッセージのリストを返す
    return messageList;
  }

  async processMessageForChannel(message: Message) {
    try {
      // チャンネルを取得
      const channel = message.channel as TextChannel;

      // MAX_TOKENSトークンを超えないメッセージのリストを取得
      const list = await this.getMessages(channel);

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
