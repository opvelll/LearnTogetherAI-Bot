// 環境変数を読み込む (開発環境の場合は.env.devを読み込む)
const envPath = process.env.NODE_ENV === "dev" ? ".env.dev" : ".env";
require("dotenv").config({
  path: envPath,
});

import MyBot from "./bot";
import logger from "./logger";
import messageHandler from "./MessageHandler/messageHandler";
import OpenAIProcessor from "./OpenAIProcessor/OpenAIProcessor";
import Pinecone from "./Pinecone/Pinecone";
import initChannelActions from "./MessageHandler/channelActions";
import interactionCreateHandler from "./InteractionHandler/InteractionHandler";
import { configLoader } from "./MessageHandler/configLoader";
import { PineconeManager } from "./Pinecone/PineconeManager";

async function main() {
  try {
    const config = configLoader();
    const openAIProcessor = new OpenAIProcessor();
    const pinecone = await Pinecone.init();
    const pineconeManager = new PineconeManager(
      pinecone,
      config.PINECONE_INDEX_NAME
    );

    const onMessage = messageHandler(
      initChannelActions(openAIProcessor, pineconeManager, config)
    );

    const onInteractionCreate = await interactionCreateHandler(pineconeManager);

    const bot = new MyBot(onMessage, onInteractionCreate);

    await bot.start();
  } catch (error) {
    logger.error(error);
  }
}

main();
