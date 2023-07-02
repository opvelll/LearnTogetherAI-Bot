import { ChannelType, Message } from "discord.js";
import logger from "../logger";
import initChannelActions from "./channelActions";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";
import { PineconeClient } from "@pinecone-database/pinecone";

export default async function messageHandler(
  message: Message,
  openAIProcessor: OpenAIProcessor,
  pinecone: PineconeClient
) {
  logger.info({ content: message.content }, "Message received:");

  // テキストチャンネル以外のメッセージは無視する
  if (message.channel.type !== ChannelType.GuildText) return;
  // Botのメッセージは無視する
  if (message.author.bot) return;

  const channelActions = await initChannelActions(openAIProcessor, pinecone);

  const channelId = message.channel.id;
  const handler = channelActions.get(channelId);

  if (handler) {
    handler.handle(message);
  }
}
