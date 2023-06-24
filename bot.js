require("dotenv").config();
const { Client, Events, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on("messageCreate", (message) => {
  console.log(message.content);
  console.log(message.author.username);
  console.log(message.author.id);
  console.log(message.channel.id);
  if (message.content === "ping") {
    message.reply("pong");
  }
});

client.on("messageReactionAdd", (reaction, user) => {
  console.log(reaction.message.content);
  console.log(reaction.emoji.name);
  console.log(user.username);
  console.log(user.id);
});

client.login(process.env.DISCORD_TOKEN);
