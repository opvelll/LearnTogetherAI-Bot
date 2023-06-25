import "dotenv/config";
import MyBot from "./bot";
import {
  ChannelHandler,
  GreetingChannelHandler,
} from "./ChannelHandler/GreetingChannelHandler";
import { SearchChannelHandler } from "./ChannelHandler/SearchChannelHandler";
import { QuestionChannelHandler } from "./ChannelHandler/QuestionChannelHandler";
import OpenAIProcessor from "./OpenAIProcessor/OpenAIProcessor";
import Pinecone from "./Pinecone/Pinecone";
import { ChannelType } from "discord.js";

async function main() {
  const openAIProcessor = new OpenAIProcessor();
  const pinecone = await Pinecone.init();

  // 任意の環境変数が設定されていない場合はエラーを投げる
  if (
    !process.env.CHANNEL_ID_GREETING ||
    !process.env.CHANNEL_ID_QUESTION ||
    !process.env.CHANNEL_ID_SEARCH
  ) {
    throw new Error("Required environment variables are not set.");
  }

  const channelActions = new Map<string, ChannelHandler>([
    [
      process.env.CHANNEL_ID_GREETING,
      new GreetingChannelHandler(openAIProcessor),
    ],
    [
      process.env.CHANNEL_ID_QUESTION,
      new QuestionChannelHandler(openAIProcessor),
    ],
    [
      process.env.CHANNEL_ID_SEARCH,
      new SearchChannelHandler(openAIProcessor, pinecone),
    ],
  ]);

  const bot = new MyBot((message) => {
    console.log(`Received message: ${message.content}`);

    if (message.channel.type !== ChannelType.GuildText) return;
    if (message.author.bot) return;

    const channelId = message.channel.id;
    const handler = channelActions.get(channelId);

    if (handler) {
      handler.handle(message);
    }
  });

  bot.start();
}

main();
