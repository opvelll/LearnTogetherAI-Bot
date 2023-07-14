import { ChannelType, Collection, Message, TextChannel } from "discord.js";
import { ChannelHandler } from "./ChannelHandler";
import { PineconeManager } from "../Pinecone/PineconeManager";
import logger from "../logger";
import {
  fetchReplyChain,
  fetchUserAndBotMessages,
  transformHistoryToRequestMessages,
} from "./Service/chatHistoryProcessor";
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
} from "openai";
import { UserEmbeddingManager } from "./Service/UserEmbeddingManager";
import { OpenAIManager } from "../OpenAI/OpenAIManager";
import { ConfigData } from "../MessageHandler/configLoader";

export class ChannelSuggestions implements ChannelHandler {
  private openAIManager: OpenAIManager;
  private parentChannelId: string;

  constructor(openAIManager: OpenAIManager, config: ConfigData) {
    this.openAIManager = openAIManager;
    this.parentChannelId = config.CHANNEL_ID_MOKUMOKU_CATEGORY!;
  }
  private systemPrompt = `
貴方はもくもく会Discordサーバーに設置されたチャンネルの管理および推奨ボットです。
貴方は参加者からもくもく会ですることを詳しく聞いて、新しいチャンネルまたは、すでにあるチャンネルから提案して下さい。
そしてチャンネルを作成して活動を促して下さい。
貴方は１つの関数(createChannel)を使用することができます。  
チャンネル名を書くときは<#チャンネルID>と書いて下さい。<#123456789>のように。
ユーザー名を書くときは<@ユーザーID>と書いて下さい。<@123456789>のように。

例:
\`\`\`
Role: User
<@1111111>: 今日もディスコード用chatgptボットの作成だ

Role: Assistant
お疲れ様です！<@1111111>さん！ディスコード用のchatGPTボットの作成、素晴らしいですね！
もし他の参加者と一緒に作業したい場合は、既存のチャンネル「〇〇」を使用することをおすすめします。そこでプロジェクトの進捗や質問などを共有することができます。

もし新しくチャンネルを作成したい場合は、ディスコード用chatGPTボットに関する話題専用のチャンネルを作成するのはいかがでしょうか？
例えば、「chatGPTボット開発」というチャンネル名と、「ディスコード用chatGPTボットの作成に関する情報共有や質問を行う場所です」というトピックを設定することができます。
どちらが良いか、もしくは他に希望があればお教えください。

Role: User
<@1111111>: じゃあ新しく作成して

Role: Assistant
{
  name: "createChannel",
  arguments: {
      name: "chatGPTボット開発",
      topic: "ディスコード用chatGPTボットの作成に関する情報共有や質問を行うことができます。"
  }
}

Role: Function
{id : 123456789, name: "chatGPTボット開発", topic: "ディスコード用chatGPTボットの作成に関する情報共有や質問を行うことができます。"}

Role: Assistant
新しいチャンネル<#123456789>が作成されました！こちらでディスコード用chatGPTボットの作成に関する情報共有や質問を行うことができます。
\`\`\`
`;

  private chatFunctions = [
    {
      name: "createChannel",
      description: "チャンネルを作成する。",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "チャンネル名",
          },
          topic: {
            type: "string",
            description: "チャンネルのトピック、概要、説明",
          },
        },
        required: ["name", "topic"],
      },
    },
  ];

  private async handleResponseMessage(
    responseMessage: ChatCompletionResponseMessage | undefined,
    message: Message<boolean>,
    requestMessages: ChatCompletionRequestMessage[]
  ) {
    if (
      responseMessage &&
      responseMessage.function_call &&
      responseMessage.function_call.arguments
    ) {
      const name = responseMessage.function_call.name;
      if (name === "createChannel") {
        const args = JSON.parse(responseMessage.function_call.arguments) as {
          name: string;
          topic: string;
        };
        const channel = await this.createChannel(
          message,
          args.name,
          args.topic
        );
        requestMessages.push(responseMessage);
        requestMessages.push({
          role: "function",
          name: name,
          content: JSON.stringify(channel),
        });
        const response2 = await this.openAIManager.chatCompletion0613(
          requestMessages
        );
        message.reply(response2!.content!);
      }
    } else {
      message.reply(responseMessage!.content!);
    }
  }

  // チャンネルの一覧を取得する
  async fetchChannels(message: Message) {
    const channels = await message.guild!.channels.fetch();
    if (!channels) {
      throw Error("チャンネルの取得に失敗しました。");
    }
    // テキストチャンネルのみを抽出する
    const channelCollection = channels.filter(
      (channel) => channel && channel.type === ChannelType.GuildText
    ) as Collection<string, TextChannel>;

    // テキストチャンネルのidとnameとtopicを取得する
    return Array.from(channelCollection.values()).map((channel) => {
      return {
        id: channel.id,
        name: channel.name,
        topic: channel.topic,
      };
    });
  }

  // チャンネルを作成する
  async createChannel(message: Message, name: string, topic: string) {
    const channel = await message.guild!.channels.create({
      name: name,
      topic: topic,
      reason: "ChatGPT Discord Bot によってもくもく会用チャンネルを作成",
      parent: this.parentChannelId,
    });
    if (!channel) {
      throw Error("チャンネルの作成に失敗しました。");
    }
    return {
      id: channel.id,
      name: channel.name,
      topic: channel.topic,
    };
  }

  async appendChannelListToPrompt(message: Message, prompt: string) {
    const channels = await this.fetchChannels(message);
    logger.info(channels, "channels");
    prompt =
      "すでにあるチャンネル一覧\n" +
      "```\n" +
      JSON.stringify(channels) +
      "```\n" +
      "\n" +
      prompt;
    return prompt;
  }

  async processMessage(message: Message): Promise<void> {
    try {
      console.log("processMessage");
      const messageList = await fetchUserAndBotMessages(10, 3000, message);
      const requestMessages = transformHistoryToRequestMessages(
        await this.appendChannelListToPrompt(message, this.systemPrompt),
        messageList
      );

      const responseMessage =
        await this.openAIManager.chatCompletionWithFunction(
          requestMessages,
          this.chatFunctions
        );
      await this.handleResponseMessage(
        responseMessage,
        message,
        requestMessages
      );
    } catch (error) {
      logger.error(error, "Error processing the introduction Channel message:");
      await message.reply("Error processing the message.");
    }
  }

  async handle(message: Message) {
    await this.processMessage(message);
  }
}
