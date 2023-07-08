import { Message } from "discord.js";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";
import { ChannelHandler } from "./GreetingChannelHandler";
import { PineconeManager } from "../Pinecone/PineconeManager";
import { MetadataObj } from "../Pinecone/MetadataObj";
import { toUnixTimeStampAtDayLevel } from "../Pinecone/dateUtils";
import logger from "../logger";
import { ChatCompletionRequestMessage } from "openai";

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
今もくもく会が開催され、貴方は参加者に今日のもくもく会ですることを聞いて回っています。
貴方は参加者が教えてくれる、もくもく会でやろうとしていることをDBに保存して下さい。やろうとしていることは具体的でなくてよいです。ふわっとした抽象的な内容でも構いません。
貴方は１つの関数(upsertAndGetSimilarUsers)を使用することができます。upsertAndGetSimilarUsers関数はユーザー情報を保存し、その情報に基づいて類似のユーザー情報リストを返します。
関数がユーザー情報を返したら、返した他のユーザー情報を使ったり、他のユーザーとのコラボをおすすめして活動を盛り上げて下さい。
ユーザー名を書く場合は、<@userId>のようにしてください。
  `;

  private chatFunctions = [
    {
      name: "upsertAndGetSimilarUsers",
      description:
        "ユーザーの情報を保存して、ユーザーに近しい人の情報を取得する",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "ユーザー情報文字列",
          },
        },
        required: ["content"],
      },
    },
  ];

  async upsertAndGetSimilarUsers(message: Message, content: string) {
    const embedding = await this.openAIProcessor.createEmbedding([
      message.content,
    ]);

    const metadata: MetadataObj = {
      channelId: message.channel.id,
      content: content,
      author: message.author.id,
      createdAt: toUnixTimeStampAtDayLevel(message.createdAt),
    };

    await this.pineconeManager.upsertData(
      message.author.id,
      embedding,
      metadata
    );

    const queryResponse = await this.pineconeManager.querySimilarEmbeddings(
      embedding,
      message.author.id
    );

    return queryResponse.matches!.map((match) => {
      const { author, content, createdAt } = match.metadata as MetadataObj;
      return { userId: author, content: content, createdAt: createdAt };
    });
  }

  async process(message: Message): Promise<void> {
    try {
      const messageList = await this.getReplyChain(message);
      const history = messageList.reverse().map((message) => {
        if (message.author.bot) {
          return {
            role: "system",
            content: message.content,
          };
        } else {
          return {
            role: "user",
            content: `<@${message.author.id}>: ${message.content}`,
          };
        }
      });
      const promptList = [
        {
          role: "system",
          content: this.systemPrompt,
        },
        ...history,
      ] as ChatCompletionRequestMessage[];

      const responseMessage =
        await this.openAIProcessor.chatCompletionClient.chatCompletionWithFunction(
          promptList,
          this.chatFunctions
        );
      if (responseMessage && responseMessage.function_call) {
        if (responseMessage.function_call.arguments) {
          const name = responseMessage.function_call.name;
          const args = JSON.parse(responseMessage.function_call.arguments) as {
            content: string;
          };
          const list = await this.upsertAndGetSimilarUsers(
            message,
            args.content
          );
          promptList.push(responseMessage);
          promptList.push({
            role: "function",
            name: name,
            content: JSON.stringify(list),
          });
          const response2 =
            await this.openAIProcessor.chatCompletionClient.chatCompletion0613(
              promptList
            );
          message.reply(response2!.content!);
        }
      } else {
        message.reply(responseMessage!.content!);
      }
    } catch (error) {
      logger.error(error, "Error processing the introduction Channel message:");
      await message.reply("Error processing the message.");
    }
  }

  async getReplyChain(message: Message) {
    let userId = message.author.id; // messageの送信者のID
    let conversationHistory: Message[] = [];
    let currentMessage: Message | undefined = message;

    while (currentMessage) {
      conversationHistory.push(currentMessage);

      if (currentMessage.reference && currentMessage.reference.messageId) {
        let messageId: string = currentMessage.reference.messageId;
        currentMessage = await message.channel.messages.fetch(messageId);
        if (
          currentMessage.author.id !== this.BOT_ID &&
          currentMessage.author.id !== userId
        ) {
          break; // 自分かボット以外のメッセージが含まれていた場合は終了
        }
      } else {
        currentMessage = undefined;
      }
    }
    return conversationHistory;
  }

  handle(message: Message): void {
    // チャンネル1での処理
    this.process(message);
  }
}
