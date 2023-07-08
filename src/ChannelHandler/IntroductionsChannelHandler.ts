import { Message, TextChannel } from "discord.js";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";
import { ChannelHandler } from "./GreetingChannelHandler";
import { PineconeManager } from "../Pinecone/PineconeManager";

import logger from "../logger";
import {
  fetchMessagesWithinTokenLimit,
  transformHistoryToRequestMessages,
} from "./chatHistoryProcessor";
import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
} from "openai";

export class IntroductionsChannelHandler implements ChannelHandler {
  private openAIProcessor: OpenAIProcessor;
  private pineconeManager: PineconeManager;
  constructor(
    openAIProcessor: OpenAIProcessor,
    pineconeManager: PineconeManager
  ) {
    this.openAIProcessor = openAIProcessor;
    this.pineconeManager = pineconeManager;
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
        await this.openAIProcessor.chatCompletionClient.chatCompletion(
          requestMessages
        );
      await message.reply(responseMessage.content!);
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
