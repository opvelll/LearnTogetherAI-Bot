import { Message } from "discord.js";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";
import { ChannelHandler } from "./ChannelHandler";
import { ChatCompletionRequestMessage } from "openai";

export class GreetingChannelHandler implements ChannelHandler {
  private openAIProcessor: OpenAIProcessor;

  constructor(openAIProcessor: OpenAIProcessor) {
    this.openAIProcessor = openAIProcessor;
  }

  async chatCompletionFromUserGreeting(messageContent: string) {
    const todayDate = new Date().toLocaleDateString();
    const systemPrompt = `
貴方は、AI勉強会サーバーに設置された挨拶を返すシンプルなボットです。
ユーザーからの挨拶に対してシンプルな挨拶を返して下さい。
なお今日の日付は${todayDate}です。

例:
ユーザー: おはよう
貴方: おはようございます!

ユーザー: こんにちは
貴方: こんにちは!
`;

    const prompts = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: messageContent,
      },
    ] as ChatCompletionRequestMessage[];
    return await this.openAIProcessor.chatCompletionClient.chatCompletion(
      prompts
    );
  }

  handle(message: Message): void {
    // チャンネル1での処理
    this.chatCompletionFromUserGreeting(message.content).then((response) => {
      message.reply(response);
    });
  }
}
