import { Message } from "discord.js";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";
import { encoding_for_model, Tiktoken } from "@dqbd/tiktoken";

export interface ChannelHandler {
  handle(message: Message): void;
}

export class SingleChannelHandler implements ChannelHandler {
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
