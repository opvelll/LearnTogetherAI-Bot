import { CommandInteraction, Interaction, TextChannel } from "discord.js";
import { fetchUserAndBotConversations } from "../../ChannelHandler/Service/chatHistoryProcessor";
import logger from "../../logger";

export default async function clearLastMsg(interaction: CommandInteraction) {
  try {
    const messages = await fetchUserAndBotConversations(20, interaction);
    const message = messages.pop();
    if (!message) return;
    await message.delete();
    await interaction.reply({
      content: "あなたとボットの履歴を削除しました。",
      ephemeral: true,
    });
  } catch (error) {
    logger.error(error);
    await interaction.reply({
      content: "あなたとボットの履歴の削除に失敗しました。権限を確認して下さい",
      ephemeral: true,
    });
  }
}
