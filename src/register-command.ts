import { CommandInteraction, REST, Routes } from "discord.js";
import { DELETE_ALL, DELETE_MY_DATA } from "./command";
import logger from "./logger";
// 環境変数を読み込む (開発環境の場合は.env.devを読み込む)
const envPath = process.env.NODE_ENV === "dev" ? ".env.dev" : ".env";

require("dotenv").config({
  path: envPath,
});

const commands = [
  {
    name: DELETE_MY_DATA,
    description:
      "DBに保存されている自分の自己紹介や今日することデータを削除します",
  },
];

const commands2 = [
  {
    name: DELETE_ALL,
    description: "DBに保存されているデータをすべて削除します",
  },
  {
    name: DELETE_MY_DATA,
    description: "DBに保存されている自己紹介や今日することデータを削除します",
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    logger.info("Started refreshing application (/) commands.");

    const existingCommands = (await rest.get(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID!,
        process.env.GUILD_ID!
      )
    )) as CommandInteraction[];
    logger.info(existingCommands);

    // Delete existing commands
    for (const command of existingCommands) {
      await rest.delete(
        Routes.applicationGuildCommand(
          process.env.DISCORD_CLIENT_ID!,
          process.env.GUILD_ID!,
          command.id
        )
      );
    }

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.DISCORD_CLIENT_ID!,
        process.env.GUILD_ID!
      ),
      {
        body: process.env.NODE_ENV === "dev" ? commands2 : commands,
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
