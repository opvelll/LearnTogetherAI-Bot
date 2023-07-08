import { Message, TextChannel } from "discord.js";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";
import { ChannelHandler } from "./GreetingChannelHandler";
import { PineconeManager } from "../Pinecone/PineconeManager";
import { MetadataObj } from "../Pinecone/MetadataObj";
import { toUnixTimeStampAtDayLevel } from "../Pinecone/dateUtils";
import logger from "../logger";
import {
  fetchMessagesWithinTokenLimit,
  fetchReplyChain,
  transformHistoryToRequestMessages,
} from "./chatHistoryProcessor";
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
} from "openai";

export class IntroductionsChannelHandler implements ChannelHandler {
  private openAIProcessor: OpenAIProcessor;
  private pineconeManager: PineconeManager;
  private BOT_ID: string;
  constructor(
    openAIProcessor: OpenAIProcessor,
    pineconeManager: PineconeManager
  ) {
    this.openAIProcessor = openAIProcessor;
    this.pineconeManager = pineconeManager;
    if (!process.env.DISCORD_CLIENT_ID) {
      throw Error("DISCORD_CLIENT_ID is not defined");
    } else {
      this.BOT_ID = process.env.DISCORD_CLIENT_ID;
    }
  }
  private systemPrompt = `
貴方の名前はTogetherAIBotで、勉強会で来た人たちの自己紹介を聞いてください。
そしてユーザーに対して他のユーザーとのコラボをおすすめして活動を盛り上げて下さい。

複数人のユーザー(userIdで区別)がいるので、ユーザー名を書く場合は、名前ではなく<@userId>のようにしてください。
もし自己紹介情報が足りないと考えたら<@userId>をつけてユーザーに聞いて下さい。

例:
userId: 397363536571138049
AIについてブログを書いています。よろしくお願いします。

userId: 349671279076311060
こんにちは、私はsgwです。AIが大好きです

こんにちは<@349671279076311060>さん。AIに興味があるのですね！他の参加者にもゲームが好きな人がいるかもしれませんね。
履歴を見ると、<@397363536571138049>さんがAIについてブログを書いています。
よろしければ、情報を交換してみてはいかがでしょうか？よいもくもく勉強会になりますように！
`;

  private chatFunctions = [
    {
      name: "saveUserInformation",
      description: "ユーザーの情報を保存する.成功したらtrueを返す",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "userId",
          },
          content: {
            type: "string",
            description: "ユーザー情報文字列",
          },
        },
        required: ["content"],
      },
    },
  ];

  private async saveUserInformation(
    message: Message<boolean>,
    userId: string,
    content: string
  ) {
    const embedding = await this.openAIProcessor.createEmbedding([
      message.content,
    ]);

    const metadata: MetadataObj = {
      channelId: message.channel.id,
      content: content,
      author: userId,
      createdAt: toUnixTimeStampAtDayLevel(message.createdAt),
    };

    await this.pineconeManager.upsertData(message.id, embedding, metadata); // message.idをuuidのように使う
    return embedding;
  }

  private async getSimilarUsers(
    embedding: number[],
    message: Message<boolean>,
    userId: string
  ) {
    const queryResponse = await this.pineconeManager.querySimilarEmbeddings(
      embedding,
      userId
    );

    return queryResponse.matches!.map((match) => {
      const { author, content, createdAt } = match.metadata as MetadataObj;
      return { userId: author, content: content, createdAt: createdAt };
    });
  }

  async upsertAndGetSimilarUsers(
    message: Message,
    userId: string,
    content: string
  ) {
    const embedding = await this.saveUserInformation(message, userId, content);

    return await this.getSimilarUsers(embedding, message, userId);
  }

  // function callの処理
  private async handleResponseMessage(
    responseMessage: ChatCompletionResponseMessage | undefined,
    message: Message<boolean>,
    requestMessages: ChatCompletionRequestMessage[]
  ) {
    if (responseMessage && responseMessage.function_call) {
      if (responseMessage.function_call.arguments) {
        const name = responseMessage.function_call.name;
        const args = JSON.parse(responseMessage.function_call.arguments) as {
          userId: string;
          content: string;
        };
        if (!args.userId) {
          args.userId = message.author.id;
        }

        await this.saveUserInformation(message, args.userId, args.content);

        requestMessages.push(responseMessage);
        requestMessages.push({
          role: "function",
          name: name,
          content: JSON.stringify(true),
        });

        const response2 =
          await this.openAIProcessor.chatCompletionClient.chatCompletion0613(
            requestMessages
          );
        message.reply(response2!.content!);
      }
    } else {
      message.reply(responseMessage!.content!);
    }
  }

  async processMessage(message: Message): Promise<void> {
    try {
      // このチャンネルのメッセージを取得,10件、3000文字以内
      const messageList = await fetchMessagesWithinTokenLimit(
        10,
        3000,
        message.channel as TextChannel
      );
      const requestMessages = transformHistoryToRequestMessages(
        this.systemPrompt,
        messageList
      );

      const responseMessage =
        await this.openAIProcessor.chatCompletionClient.chatCompletionWithFunction(
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

  handle(message: Message): void {
    // チャンネル1での処理
    this.processMessage(message);
  }
}
