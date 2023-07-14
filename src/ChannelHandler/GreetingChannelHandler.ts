import { Message } from "discord.js";
import { ChannelHandler } from "./ChannelHandler";
import { ChatCompletionRequestMessage } from "openai";
import { OpenAIManager } from "../OpenAI/OpenAIManager";

export class GreetingChannelHandler implements ChannelHandler {
  private openAIManager: OpenAIManager;

  constructor(openAIManager: OpenAIManager) {
    this.openAIManager = openAIManager;
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
    return await this.openAIManager.chatCompletion(prompts);
  }

  async handle(message: Message) {
    const response = await this.chatCompletionFromUserGreeting(message.content);
    await message.reply(response.content!);
  }
}
