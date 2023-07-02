import MyBot from "./bot";
import { Interaction } from "discord.js";
import logger from "./logger";
import messageHandler from "./MessageHandler/messageHandler";
import OpenAIProcessor from "./OpenAIProcessor/OpenAIProcessor";
import Pinecone from "./Pinecone/Pinecone";

async function main() {
  try {
    const interactionCreateHandler = async (interaction: Interaction) => {
      if (!interaction.isCommand()) return;

      const { commandName } = interaction;

      if (commandName === "ping") {
        await interaction.reply("Pong!");
      }
    };

    const openAIProcessor = new OpenAIProcessor();
    const pinecone = await Pinecone.init();

    const bot = new MyBot(
      messageHandler,
      interactionCreateHandler,
      openAIProcessor,
      pinecone
    );

    await bot.start();
  } catch (error) {
    logger.error(error);
  }
}

main();
