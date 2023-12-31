// 環境変数を読み込む (開発環境の場合は.env.devを読み込む)
const envPath = process.env.NODE_ENV === "dev" ? ".env.dev" : ".env";
require("dotenv").config({
  path: envPath,
});

import MyBot from "./bot";
import logger from "./logger";
import messageHandler from "./MessageHandler/messageHandler";
import createPineconeInstance from "./Pinecone/Pinecone";
import initChannelActions from "./MessageHandler/channelActions";
import interactionCreateHandler from "./InteractionHandler/InteractionHandler";
import { configLoader } from "./MessageHandler/configLoader";
import { PineconeManager } from "./Pinecone/PineconeManager";
import createOpenAIApiInstance from "./OpenAI/OpenAIConfigurator";
import { OpenAIManager } from "./OpenAI/OpenAIManager";

async function main() {
  try {
    const config = configLoader();
    const openAIManager = new OpenAIManager(
      createOpenAIApiInstance(
        config.OPENAI_ORGANIZATION_ID,
        config.OPENAI_API_KEY
      )
    );
    const pinecone = await createPineconeInstance(
      config.PINECONE_ENVIRONMENT,
      config.PINECONE_API_KEY
    );
    const pineconeManager = new PineconeManager(
      pinecone,
      config.PINECONE_INDEX_NAME
    );

    const onMessage = messageHandler(
      initChannelActions(openAIManager, pineconeManager, config)
    );

    const onInteractionCreate = await interactionCreateHandler(pineconeManager);

    const bot = new MyBot(onMessage, onInteractionCreate);

    await bot.start();
  } catch (error) {
    logger.error(error);
  }
}

main();
