import { Client, Events, GatewayIntentBits, Message } from "discord.js";
import logger from "./logger";

// Discord Botのクラス
class MyBot {
  private client: Client;
  private messageHandler: (message: Message) => void;

  /**
   * MyBotのコンストラクタ。
   * @param messageHandler メッセージを処理するためのコールバック関数。
   */
  constructor(messageHandler: (message: Message) => void) {
    // メッセージハンドラを初期化
    this.messageHandler = messageHandler;

    // Discordクライアントを作成
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
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
  }

  /**
   * Botを開始します。環境変数からトークンを読み取り、Discordにログインします。
   */
  public async start() {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      logger.error("DISCORD_TOKEN is not set in environment variables.");
      return;
    }

    try {
      // Discordにログイン
      await this.client.login(token);
      logger.info("Bot has started successfully.");
    } catch (error) {
      logger.error("Error starting the bot:", error);
    }
  }
}

export default MyBot;
