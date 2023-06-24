import { Message, Client, TextChannel } from "discord.js";
import { ChannelHandler } from "./ChannelHandler";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";

export class MultiChannelHandler implements ChannelHandler {
  private chatManager: OpenAIProcessor;

  constructor(chatManager: OpenAIProcessor) {
    this.chatManager = chatManager;
  }

  estimateTokenCount(japaneseText: string): number {
    // 日本語の文字数をカウント
    const charCount = Array.from(japaneseText).length;
    // 文字数を1.5倍にしてトークン数を推定
    const estimatedTokenCount = charCount * 1.5;
    return estimatedTokenCount;
  }

  async getMessages(channel: TextChannel) {
    // 最新の100件のメッセージを取得
    const messages = await channel.messages.fetch({ limit: 100 });

    let totalTokens = 0;
    const messageList: Message[] = [];

    // 新しいメッセージから順に処理
    for (let [key, message] of messages.reverse()) {
      const estimatedTokens = this.estimateTokenCount(message.content);

      // トークン数が3000を超える場合、処理を停止
      if (totalTokens + estimatedTokens > 3000) {
        break;
      }

      totalTokens += estimatedTokens;
      messageList.push(message);
    }

    // トークン数が3000を超えないメッセージのリストを返す
    return messageList;
  }

  async process(message: Message) {
    // チャンネルを取得
    const channel = (await message.client.channels.fetch(
      process.env.CHANNEL_ID_MULTI!
    )) as TextChannel;

    // 3000トークンを超えないメッセージのリストを取得
    const list = await this.getMessages(channel);
    // メッセージをコンソールに表示
    list.forEach((message) => {
      console.log(`${message.author.tag}: ${message.content}`);
    });

    this.chatManager.chatCompletionFromChannelHistory(list).then((response) => {
      message.reply(response);
    });
  }

  handle(message: Message): void {
    try {
      this.process(message).then(() => {});
    } catch (error) {
      console.error("Error fetching messages: ", error);
    }
  }
}
