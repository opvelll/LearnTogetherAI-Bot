import { CommandInteraction, Interaction } from "discord.js";
import { PineconeManager } from "../../Pinecone/PineconeManager";
import logger from "../../logger";

export default async function deleteAllData(
  interaction: CommandInteraction,
  pineconeManager: PineconeManager
) {
  try {
    await pineconeManager.deleteAllData();

    await interaction.reply({
      content: "すべてのデータを削除しました。",
      ephemeral: true,
    });
  } catch (error) {
    logger.error(error);
    await interaction.reply({
      content: "すべてのデータの削除に失敗しました。",
      ephemeral: true,
    });
  }
}
