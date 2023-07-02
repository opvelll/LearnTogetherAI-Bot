import {
  Client,
  Events,
  GatewayIntentBits,
  Interaction,
  Message,
} from "discord.js";
import logger from "./logger";
import OpenAIProcessor from "./OpenAIProcessor/OpenAIProcessor";
import { PineconeClient } from "@pinecone-database/pinecone";
import Pinecone from "./Pinecone/Pinecone";

// Discord Botのクラス
class MyBot {
  private client: Client;
  private messageHandler: (message: Message) => void;
  private interactionCreateHandler: (interaction: Interaction) => void;
  /**
   * MyBotのコンストラクタ。
   * @param messageHandler メッセージを処理するためのコールバック関数。
   */
  constructor(
    messageHandler: (message: Message) => void,
    interactionCreateHandler: (interaction: Interaction) => void
  ) {
    // メッセージハンドラを初期化
    this.messageHandler = messageHandler;
    this.interactionCreateHandler = interactionCreateHandler;

    // Discordクライアントを作成
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });

    // クライアントが準備完了したときのイベントハンドラ
    this.client.once(Events.ClientReady, (c) => {
      logger.info(`Ready! Logged in as ${c.user.tag}`);
    });

    // 新しいメッセージが作成されたときに呼び出されるイベントハンドラ
    this.client.on("messageCreate", (message) => {
      this.messageHandler(message);
    });

    this.client.on("interactionCreate", (interaction) => {
      this.interactionCreateHandler(interaction);
    });
  }

  /**
   * Botを開始します。環境変数からトークンを読み取り、Discordにログインします。
   */
  public async start() {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      const errorMessage = "DISCORD_TOKEN is not set in environment variables.";
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      // Discordにログイン
      await this.client.login(token);
      logger.info("Bot has started successfully.");
    } catch (error) {
      logger.error(error, "Error starting the bot:");
    }
  }
}

export default MyBot;
