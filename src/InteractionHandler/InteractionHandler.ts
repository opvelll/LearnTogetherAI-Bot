import { Interaction } from "discord.js";
import { DELETE_MY_DATA } from "../command";
import Pinecone from "../Pinecone/Pinecone";
import { PineconeClient } from "@pinecone-database/pinecone";
import logger from "../logger";
import { PineconeManager } from "../Pinecone/PineconeManager";

export default async function interactionCreateHandler(
  pineconeManager: PineconeManager
) {
  return async (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === DELETE_MY_DATA) {
      try {
        await pineconeManager.deleteUserData(interaction.user.id);

        await interaction.reply({
          content: `<@${interaction.user.id}> さんのデータを削除しました。`,
          ephemeral: true,
        });
      } catch (error) {
        logger.error(error);
        await interaction.reply({
          content: `<@${interaction.user.id}> さんのデータの削除に失敗しました。`,
          ephemeral: true,
        });
      }
    }
  };
}
