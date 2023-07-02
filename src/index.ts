// 環境変数を読み込む (開発環境の場合は.env.devを読み込む)
const envPath = process.env.NODE_ENV === "dev" ? ".env.dev" : ".env";
require("dotenv").config({
  path: envPath,
});

import MyBot from "./bot";
import { Interaction } from "discord.js";
import logger from "./logger";
import messageHandler from "./MessageHandler/messageHandler";
import OpenAIProcessor from "./OpenAIProcessor/OpenAIProcessor";
import Pinecone from "./Pinecone/Pinecone";
import initChannelActions from "./MessageHandler/channelActions";
import { DELETE_MY_DATA } from "./command";
import interactionCreateHandler from "./InteractionHandler/InteractionHandler";

async function main() {
  try {
    const openAIProcessor = new OpenAIProcessor();
    const pinecone = await Pinecone.init();

    const onMessage = messageHandler(
      initChannelActions(openAIProcessor, pinecone)
    );

    const onInteractionCreate = await interactionCreateHandler(pinecone);

    const bot = new MyBot(onMessage, onInteractionCreate);

    await bot.start();
  } catch (error) {
    logger.error(error);
  }
}

main();
