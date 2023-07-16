import { Message } from "discord.js";
import { ChannelHandler } from "./ChannelHandler";
import { PineconeManager } from "../Pinecone/PineconeManager";
import logger from "../logger";
import {
  fetchReplyChain,
  fetchUserAndBotConversations,
  fetchConversationsWithTokenLimit,
  transformHistoryToRequestMessages,
} from "./Service/chatHistoryProcessor";
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
} from "openai";
import { OpenAIManager } from "../OpenAI/OpenAIManager";
import { UserEmbeddingManager } from "./Service/UserEmbeddingManager";

export class WorkPlanChannelHandler2 implements ChannelHandler {
  private openAIManager: OpenAIManager;
  private pineconeManager: PineconeManager;
  private BOT_ID: string;
  private UserEmbeddingManager: UserEmbeddingManager;

  constructor(openAIManager: OpenAIManager, pineconeManager: PineconeManager) {
    this.openAIManager = openAIManager;
    this.pineconeManager = pineconeManager;
    if (!process.env.DISCORD_CLIENT_ID) {
      throw Error("DISCORD_CLIENT_ID is not defined");
    } else {
      this.BOT_ID = process.env.DISCORD_CLIENT_ID;
    }
    this.UserEmbeddingManager = new UserEmbeddingManager(
      openAIManager,
      pineconeManager
    );
  }
  private systemPrompt = `
あなたはもくもく勉強会用のアドバイザーです。
あなたはユーザーにもくもく会でやろうとしていること聞いて、DBに保存して下さい。そしてもくもく会での共有、つながり、学習を促して下さい。

あなたは１つの関数(upsertAndGetSimilarUsers)を使用することができます。
upsertAndGetSimilarUsers関数はユーザー情報や会話履歴を保存し、その情報に基づいて類似のユーザー情報リストを返します。
関数がユーザー情報を返したら、必要ならその情報を使って他のユーザーとのコラボをおすすめして活動を盛り上げて下さい。
ユーザー名を書く場合は、<@userId>のようにしてください。

例:
\`\`\`
Role: User
<@123456789>: 今日はai discord botについての記事を書きます

Role: Assistant
それは素晴らしいですね！AIとDiscordボットについての記事を書くのは、他の人にも役立つ情報を提供できるかもしれません。もくもく勉強会での質問や共有やフィードバックを受けることもおすすめです。\n\nあなたのもくもく勉強会での目的やプロジェクトについて教えていただけますか？そして何を学びたいですか？

Role: User
<@123456789>: chat gpt apiの使い方について学びたいですね

Role: Assistant
素晴らしい目標です！Chat GPT APIについて学ぶことで、AIチャットボットの作成や応用ができるようになります。\n\n他にもあなたのプロフィールや、関心のある技術などを教えてください。

Role: User
<@123456789>: ai全般に関心があります

Role: Assistant
素晴らしいです！AI全般に関心があるということは、様々な分野のAIについて学ぶことができますね。\n\n私は、あなたのプロジェクトと関心、会話履歴を保存し、類似のユーザー情報を探します。少々お待ちください。
{
  name: "upsertAndGetSimilarUsers",
  arguments: {"userId": "123456789","content": "プロジェクト: AI Discord Botについての記事の執筆\\n目的: Chat GPT APIについて学ぶ\\n関心のある分野: AI全般\\n会話履歴: 今日はai discord botについての記事を書きます\\nchat gpt apiの使い方について学びたいですね\\nai全般に関心があります"}
}

Role: Function
[{author:"987654321",content:"関心のある分野:AI\\n会話履歴: 今日はdiscord botのことを記事にしよう\\nAIに興味があります","createdAt":1689174000000}]

Role: Assistant
今日のもくもく勉強会でおすすめの参加者がいます。
<@987654321>さんはDiscord Botについて記事を執筆するというプロジェクトに取り組んでいます。お互いの進捗や学びを共有できるかもしれません。
ぜひ参加者との交流や学びの共有をお楽しみください！よいもくもく勉強会にしましょう！
\`\`\`
  `;

  private chatFunctions = [
    {
      name: "upsertAndGetSimilarUsers",
      description:
        "ユーザーの情報を保存して、ユーザーの情報に近い他のユーザー情報を取得する",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "userId",
          },
          content: {
            type: "string",
            description: "ユーザーについての情報と会話履歴を含む文字列",
          },
        },
        required: ["content"],
      },
    },
  ];

  private async handleResponseMessage(
    responseMessage: ChatCompletionResponseMessage | undefined,
    message: Message<boolean>,
    requestMessages: ChatCompletionRequestMessage[]
  ) {
    if (responseMessage && responseMessage.function_call) {
      if (responseMessage.function_call.arguments) {
        if (responseMessage.content) {
          await message.reply(responseMessage.content);
        }
        await message.reply(responseMessage.function_call.arguments);
        const name = responseMessage.function_call.name;
        const args = JSON.parse(responseMessage.function_call.arguments) as {
          userId: string;
          content: string;
        };
        const list = await this.UserEmbeddingManager.upsertAndGetSimilarUsers(
          message,
          args.content
        );
        requestMessages.push(responseMessage);
        requestMessages.push({
          role: "function",
          name: name,
          content: JSON.stringify(list),
        });
        const response2 = await this.openAIManager.chatCompletion0613(
          requestMessages
        );
        await message.reply(response2!.content!);
      }
    } else {
      await message.reply(responseMessage!.content!);
    }
  }

  async processMessage(message: Message): Promise<void> {
    try {
      const messageList = await fetchConversationsWithTokenLimit(
        12,
        3300,
        message
      );
      const requestMessages = transformHistoryToRequestMessages(
        this.systemPrompt,
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
      await message.reply(
        "Error processing the message.\n/clear_last_messageコマンドでメッセージを削除してもう一回発言してみて下さい。"
      );
    }
  }

  async handle(message: Message) {
    await this.processMessage(message);
  }
}
