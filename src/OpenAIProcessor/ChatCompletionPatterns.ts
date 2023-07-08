import { Message } from "discord.js";
import { ChatCompletionRequestMessage, OpenAIApi } from "openai";
import { OpenAIClient } from "./OpenAIClient";

export class ChatCompletionPatterns extends OpenAIClient {
  private modelTrainingDate: string;

  constructor(openai: OpenAIApi) {
    super(openai);
    this.modelTrainingDate = "Sep 2021";
  }

  async chatCompletionFromUserGreeting(userInput: string) {
    const todayDate = new Date().toLocaleDateString();
    const systemPrompt = `
貴方は、AI勉強会サーバーに設置された挨拶を返すシンプルなボットです。
ユーザーからの挨拶に対して簡潔に一回のやりとりで終わる挨拶をお願いします。
なお今日の日付は${todayDate}で、貴方の最終学習日は${this.modelTrainingDate}です。`;

    const prompts = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userInput,
      },
    ] as ChatCompletionRequestMessage[];
    return await this.chatCompletionClient.chatCompletion(prompts);
  }
  async chatCompletionFromIntroduction(userInput: string) {
    const todayDate = new Date().toLocaleDateString();
    const systemPrompt = `
貴方は、AI勉強会サーバーに設置されたシンプルなボットです。
ユーザーの自己紹介に一回のやりとりで終わるように答えて下さい。
なお今日の日付は${todayDate}で、貴方の最終学習日は${this.modelTrainingDate}です。`;

    const prompts = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userInput,
      },
    ] as ChatCompletionRequestMessage[];
    return await this.chatCompletionClient.chatCompletion(prompts);
  }

  async chatCompletionFromUserWorkPlan(
    userId: string,
    userInput: string,
    context: [string, string, Date][]
  ) {
    const todayDate = new Date().toLocaleDateString();
    const systemPrompt = `
もくもく勉強会用挨拶BOTとして振る舞ってください。
ユーザーの今日やることや目的に対して、答えて下さい。
またシステムがDBを検索し、他の過去のユーザーの自己紹介文があれば挿入します。
その情報を必要なら使い、ユーザーが勉強会でコラボすると面白いユーザーを紹介して盛り上げてください。（これは任意です）
ユーザー名を書く場合は、<@userId>のようにしてください。
ユーザーとは一回のやりとりで終わるようにして下さい。
今日の日付は${todayDate}で、貴方の最終学習日は${this.modelTrainingDate}です。

例:
userId: 349671279076311060
こんにちは、AAです。よろしくお願いします。今日はUnityでゲームを作ります。

[システムの挿入]
userId: 397363536571138049
よろしくBBです。今日はシェーダープログラミングの勉強をします。

...

こんにちは<@349671279076311060>さん。Unityを使ったゲームづくりに興味があるのですね！
他の参加者の自己紹介情報を見ると、<@397363536571138049>さんがシェーダープログラミングの勉強をしています。
よろしければ、情報を交換してみてはいかがでしょうか？よいもくもく勉強会になりますように！
`;

    const contextPrompt = context
      .map(
        ([userId, message, date]) =>
          `
---
date: ${date.toLocaleDateString()} 
userId: ${userId} 
${message}
---`
      )
      .join("\n");

    const prompts = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: `
userId: ${userId}
${userInput} 

[システムからの挿入: 以下を参考に]:
${contextPrompt} 

`,
      },
    ] as ChatCompletionRequestMessage[];
    return await this.chatCompletionClient.chatCompletion(prompts);
  }

  async chatCompletionFromQuestionWithChannelHistory(
    messages: Message<boolean>[]
  ) {
    const todayDate = new Date().toLocaleDateString();
    const systemPrompt = `
貴方はAI勉強会会場にいる想像力豊かで、色々なことに興味を持つ良き相談役です。
ユーザーの質問に簡潔に答えてください。
今日の日付は${todayDate}で、貴方の最終学習日は${this.modelTrainingDate}です。`;

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
    return await this.chatCompletionClient.chatCompletion(prompts);
  }
}
