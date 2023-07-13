import { Message } from "discord.js";
import { ChatCompletionRequestMessage, OpenAIApi } from "openai";
import { OpenAIClient } from "./OpenAIClient";

export class ChatCompletionPatterns extends OpenAIClient {
  private modelTrainingDate: string;

  constructor(openai: OpenAIApi) {
    super(openai);
    this.modelTrainingDate = "Sep 2021";
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
