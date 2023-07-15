import { CommandInteraction, Interaction } from "discord.js";
import { PineconeManager } from "../../Pinecone/PineconeManager";
import logger from "../../logger";

export default async function deleteMyData(
  interaction: CommandInteraction,
  pineconeManager: PineconeManager
) {
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
