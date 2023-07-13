import { Message } from "discord.js";

export interface ChannelHandler {
  handle(message: Message): Promise<void>;
}
