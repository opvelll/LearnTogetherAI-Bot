import { Interaction, TextChannel } from "discord.js";
import { CLEAR_CHAT, DELETE_ALL, DELETE_MY_DATA } from "../command";
import logger from "../logger";
import { PineconeManager } from "../Pinecone/PineconeManager";
import { fetchUserAndBotConversations } from "../ChannelHandler/Service/chatHistoryProcessor";

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
    } else if (commandName === DELETE_ALL) {
      await pineconeManager.deleteAllData();
      await interaction.reply({
        content: "すべてのデータを削除しました。",
        ephemeral: true,
      });
    } else if (commandName === CLEAR_CHAT) {
      try {
        const messages = await fetchUserAndBotConversations(20, interaction);
        (interaction.channel as TextChannel).bulkDelete(messages);
        await interaction.reply({
          content: "あなたとボットの履歴を削除しました。",
          ephemeral: true,
        });
      } catch (error) {
        logger.error(error);
        await interaction.reply({
          content:
            "あなたとボットの履歴の削除に失敗しました。権限を確認して下さい",
          ephemeral: true,
        });
      }
    }
  };
}
