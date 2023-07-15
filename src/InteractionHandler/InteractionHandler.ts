import { Interaction, TextChannel } from "discord.js";
import deleteMyData from "./commands/deleteMyData";
import deleteAllData from "./commands/deleteAllData";
import clearChat from "./commands/clearChat";
import { PineconeManager } from "../Pinecone/PineconeManager";
import logger from "../logger";
import {
  CLEAR_CHAT,
  CLEAR_LAST_MSG,
  DELETE_ALL,
  DELETE_MY_DATA,
} from "../command";
import clearLastMsg from "./commands/clearLastMsg";

const commandHandlers = new Map<string, Function>();
commandHandlers.set(DELETE_MY_DATA, deleteMyData);
commandHandlers.set(DELETE_ALL, deleteAllData);
commandHandlers.set(CLEAR_CHAT, clearChat);
commandHandlers.set(CLEAR_LAST_MSG, clearLastMsg);

export default async function interactionCreateHandler(
  pineconeManager: PineconeManager
) {
  return async (interaction: Interaction) => {
    logger.info("Interaction received");
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    const commandHandler = commandHandlers.get(commandName);
    if (commandHandler) {
      await commandHandler(interaction, pineconeManager);
    }
  };
}
