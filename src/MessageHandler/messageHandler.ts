import { ChannelType, Message } from "discord.js";
import logger from "../logger";
import { ChannelHandler } from "../ChannelHandler/GreetingChannelHandler";

export default function messageHandler(
  channelActions: Map<string, ChannelHandler>
) {
  return (message: Message) => {
    logger.info({ content: message.content }, "Message received:");

    // テキストチャンネル以外のメッセージは無視する
    if (message.channel.type !== ChannelType.GuildText) return;
    // Botのメッセージは無視する
    if (message.author.bot) return;

    const channelId = message.channel.id;
    const handler = channelActions.get(channelId);

    if (handler) {
      handler.handle(message);
    }
  };
}
