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
import logger from "./logger";

// 環境変数を読み込む (開発環境の場合は.env.devを読み込む)
const envPath = process.env.NODE_ENV === "dev" ? ".env.dev" : ".env";

require("dotenv").config({
  path: envPath,
});

// すべての環境変数が設定されていない場合はエラーを投げる
const { CHANNEL_ID_GREETING, CHANNEL_ID_QUESTION, CHANNEL_ID_SEARCH } =
  process.env;
if (!CHANNEL_ID_GREETING && !CHANNEL_ID_QUESTION && !CHANNEL_ID_SEARCH) {
  const errorMessage =
    "None of the required environment variables are set.(channel id)";
  logger.error(errorMessage);
  throw new Error(errorMessage);
}

async function main() {
  try {
    const openAIProcessor = new OpenAIProcessor();
    const pinecone = await Pinecone.init();

    const channelActions = new Map<string, ChannelHandler>();

    if (CHANNEL_ID_GREETING) {
      channelActions.set(
        CHANNEL_ID_GREETING,
        new GreetingChannelHandler(openAIProcessor)
      );
    }

    if (CHANNEL_ID_QUESTION) {
      channelActions.set(
        CHANNEL_ID_QUESTION,
        new QuestionChannelHandler(openAIProcessor)
      );
    }

    if (CHANNEL_ID_SEARCH) {
      channelActions.set(
        CHANNEL_ID_SEARCH,
        new SearchChannelHandler(openAIProcessor, pinecone)
      );
    }

    const bot = new MyBot((message) => {
      logger.info(`Received message: ${message.content}`);

      if (message.channel.type !== ChannelType.GuildText) return;
      if (message.author.bot) return;

      const channelId = message.channel.id;
      const handler = channelActions.get(channelId);

      if (handler) {
        handler.handle(message);
      }
    });

    await bot.start();
  } catch (error) {
    logger.error(error);
  }
}

main();
