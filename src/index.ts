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

async function main() {
  try {
    const openAIProcessor = new OpenAIProcessor();
    const pinecone = await Pinecone.init();
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

    const interactionCreateHandler = async (interaction: Interaction) => {
      if (!interaction.isCommand()) return;

      if (interaction.channelId !== process.env.CHANNEL_ID_SEARCH) {
        await interaction.reply(
          `このコマンドは <#${process.env.CHANNEL_ID_SEARCH}> で実行してください。`
        );
        return;
      }

      const { commandName } = interaction;

      if (commandName === DELETE_MY_DATA) {
        const request = {
          deleteRequest: {
            filter: {
              author: { $eq: interaction.user.id },
            },
          },
        };

        const response = await index._delete(request);
        logger.info({ response }, "Deleted pinecone data");
        await interaction.reply(
          `<@${interaction.user.id}> さんのデータを削除しました。`
        );
      }
    };

    const onMessage = messageHandler(
      initChannelActions(openAIProcessor, pinecone)
    );

    const bot = new MyBot(onMessage, interactionCreateHandler);

    await bot.start();
  } catch (error) {
    logger.error(error);
  }
}

main();
