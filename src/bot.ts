import { Client, Events, GatewayIntentBits, Message } from "discord.js";

class MyBot {
  private client: Client;
  private messageHandler: (message: Message) => void;

  constructor(messageHandler: (message: Message) => void) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.client.once(Events.ClientReady, (c) => {
      console.log(`Ready! Logged in as ${c.user.tag}`);
    });

    this.client.on("messageCreate", (message: Message) => {
      this.messageHandler(message);
    });

    this.messageHandler = messageHandler;
  }

  public start() {
    this.client.login(process.env.DISCORD_TOKEN);
  }
}

export default MyBot;
