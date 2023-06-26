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

require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
});

async function main() {
  const openAIProcessor = new OpenAIProcessor();
  const pinecone = await Pinecone.init();

  const channelActions = new Map<string, ChannelHandler>();

  if (process.env.CHANNEL_ID_GREETING) {
    channelActions.set(
      process.env.CHANNEL_ID_GREETING,
      new GreetingChannelHandler(openAIProcessor)
    );
  }

  if (process.env.CHANNEL_ID_QUESTION) {
    channelActions.set(
      process.env.CHANNEL_ID_QUESTION,
      new QuestionChannelHandler(openAIProcessor)
    );
  }

  if (process.env.CHANNEL_ID_SEARCH) {
    channelActions.set(
      process.env.CHANNEL_ID_SEARCH,
      new SearchChannelHandler(openAIProcessor, pinecone)
    );
  }

  // すべての環境変数が設定されていない場合はエラーを投げる
  if (
    !process.env.CHANNEL_ID_GREETING &&
    !process.env.CHANNEL_ID_QUESTION &&
    !process.env.CHANNEL_ID_SEARCH
  ) {
    throw new Error(
      "None of the required environment variables are set.(channel id)"
    );
  }

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
