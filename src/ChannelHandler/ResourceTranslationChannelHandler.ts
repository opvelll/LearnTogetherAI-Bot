import { Message, PresenceManager } from "discord.js";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";
import logger from "../logger";
import { ChatCompletionRequestMessage } from "openai";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import { ChannelHandler } from "./ChannelHandler";

export class ResourceTranslationChannelHandler implements ChannelHandler {
  private openAIProcessor: OpenAIProcessor;
  private systemPrompt: string = `
  I will give you the text, please summarize and translate it into Japanese.
  `;

  constructor(openAIProcessor: OpenAIProcessor) {
    this.openAIProcessor = openAIProcessor;
  }

  // urlを抽出する関数
  extractUrls(text: string): string[] {
    const urlPattern =
      /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
    return text.match(urlPattern) || [];
  }

  async process(message: Message) {
    const urls = this.extractUrls(message.content);
    const MAX_TOKENS = 9000;
    let tokeCount = 0;
    let texts = "";

    // url以外のテキスト、またはメッセージのみがあった場合それも翻訳する
    if (urls[0] !== message.content) {
      texts = message.content;
      tokeCount = message.content.length;
    }

    try {
      // urlがあった場合はスクレイピングしてテキストを取得する
      if (urls.length !== 0) {
        const response = await fetch(urls[0]);
        const body = await response.text();
        const $ = cheerio.load(body);
        const title = $("title").text();
        const content = $("body").text();

        logger.info({ title, content }, "result");
        texts = `
${texts}
\`\`\`
title: ${title}
content: ${content.slice(0, MAX_TOKENS - tokeCount)}
\`\`\`
`;
      }

      // OpenAIに投げる
      const chatCompletionMessages = [
        {
          role: "system",
          content: this.systemPrompt,
        },
        {
          role: "user",
          content: texts,
        },
      ] as ChatCompletionRequestMessage[];

      const responseMessage =
        await this.openAIProcessor.chatCompletionClient.chatCompletion16k(
          chatCompletionMessages
        );

      message.reply(responseMessage.content!);
    } catch (error) {
      logger.error({ error }, "url translation error");
      message.reply("Sorry, I couldn't translate it.");
    }
  }

  handle(message: Message): void {
    this.process(message);
  }
}
