import { Message } from "discord.js";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";

export interface ChannelHandler {
  handle(message: Message): void;
}

export class GreetingChannelHandler implements ChannelHandler {
  private openAIProcessor: OpenAIProcessor;

  constructor(openAIProcessor: OpenAIProcessor) {
    this.openAIProcessor = openAIProcessor;
  }

  handle(message: Message): void {
    // チャンネル1での処理
    this.openAIProcessor
      .chatCompletionFromUserInput(message.content)
      .then((response) => {
        message.reply(response);
      });
  }
}
