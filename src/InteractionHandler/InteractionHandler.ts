import { Interaction } from "discord.js";
import { DELETE_MY_DATA } from "../command";
import Pinecone from "../Pinecone/Pinecone";
import { PineconeClient } from "@pinecone-database/pinecone";
import logger from "../logger";

export default async function interactionCreateHandler(
  pinecone: PineconeClient
) {
  return async (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

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
      await interaction.reply({
        content: `<@${interaction.user.id}> さんのデータを削除しました。`,
        ephemeral: true,
      });
    }
  };
}
