import { Message, PresenceManager } from "discord.js";
import logger from "../logger";
import { ChatCompletionRequestMessage } from "openai";
import * as cheerio from "cheerio";
import fetch from "node-fetch";
import { ChannelHandler } from "./ChannelHandler";
import { OpenAIManager } from "../OpenAI/OpenAIManager";
import puppeteer from "puppeteer";

// このチャンネルハンドラは、メッセージにURLが含まれていた場合、そのURLのページをスクレイピングして、
// そのページのタイトルと本文をOpenAIに投げて、日本語に翻訳して返す。
export class ResourceTranslationChannelHandler implements ChannelHandler {
  private openAIManager: OpenAIManager;
  private systemPrompt: string = `
  I will give you the text, please summarize and translate it into Japanese.
  `;

  constructor(openAIManager: OpenAIManager) {
    this.openAIManager = openAIManager;
  }

  // urlを抽出する関数
  extractUrls(text: string): string[] {
    const urlPattern =
      /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
    return text.match(urlPattern) || [];
  }

  async process(message: Message) {
    const urls = this.extractUrls(message.content);
    const MAX_TOKENS = 4000;
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
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        await page.goto(urls[0], { waitUntil: "networkidle0" });
        const html = await page.content();

        const $ = cheerio.load(html);
        const title = $("title").text();
        let content: string;

        if (urls[0].includes("twitter.com")) {
          // Twitterのページの場合はarticleタグ内のテキストを取得
          content = $("article").text();
        } else {
          // それ以外のページの場合はbodyタグ内のテキストを取得
          content = $("body").text();
        }

        logger.info({ title, content }, "result");
        texts = `
${texts}
\`\`\`
title: ${title}
content: ${content.slice(0, MAX_TOKENS - tokeCount)}
\`\`\`
`;
        await browser.close();
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

      const responseMessage = await this.openAIManager.chatCompletion(
        chatCompletionMessages
      );

      await message.reply(responseMessage.content!);
    } catch (error) {
      logger.error({ error }, "url translation error");
      await message.reply("Sorry, I couldn't translate it.");
    }
  }

  async handle(message: Message) {
    await this.process(message);
  }
}
