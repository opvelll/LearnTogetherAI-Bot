import { get_encoding } from "@dqbd/tiktoken";
import { Message, TextChannel } from "discord.js";
import { ChatCompletionRequestMessage } from "openai";

export async function fetchUserAndBotMessages(
  messagesLimit: number,
  MAX_TOKENS: number,
  userMessage: Message
) {
  const channel = userMessage.channel as TextChannel;
  const messages = await channel.messages.fetch({ limit: messagesLimit });

  const messageMap = messages
    .filter((msg) => msg.author.id === userMessage.author.id)
    .reduce((map, message) => map.set(message.id, message), new Map());

  const context = messages.filter((msg) => {
    if (msg.author.id === userMessage.author.id) {
      return true;
    }
    if (
      msg.author.bot &&
      msg.reference &&
      messageMap.has(msg.reference.messageId)
    ) {
      return true;
    }
    return false;
  });

  let totalTokens = 0;
  const messageList: Message[] = [];

  for (let [key, value] of context) {
    const estimatedTokens = calculateTokenLength(value.content);

    if (totalTokens + estimatedTokens > MAX_TOKENS) {
      break;
    }

    totalTokens += estimatedTokens;
    messageList.unshift(value);
  }

  return messageList;
}

/**
 * This function fetches the reply chain of a given message.
 * It only includes messages by the bot and the original author,
 * and stops at either 10 messages or a message by a different author.
 *
 * @param BOT_ID - The bot's Discord ID
 * @param message - The Discord message to get the reply chain of
 * @returns - A promise that resolves to the reply chain
 */
export async function fetchReplyChain(BOT_ID: string, message: Message) {
  const authorId = message.author.id; // The ID of the sender of the message
  let conversationHistory: Message[] = [];
  let currentMessage: Message | undefined = message;
  const MAX_MESSAGE_COUNT = 10;

  while (currentMessage) {
    conversationHistory.push(currentMessage);

    if (conversationHistory.length > MAX_MESSAGE_COUNT) {
      break;
    }

    if (currentMessage.reference && currentMessage.reference.messageId) {
      const messageId: string = currentMessage.reference.messageId;
      currentMessage = await message.channel.messages.fetch(messageId);
      if (
        currentMessage.author.id !== BOT_ID &&
        currentMessage.author.id !== authorId
      ) {
        break; // If the message contains anything from neither the user nor the bot, then stop
      }
    } else {
      currentMessage = undefined;
    }
  }

  return conversationHistory.reverse();
}

/**
 * This function transforms a history of Discord messages into request messages for the OpenAI API.
 *
 * @param  systemPrompt - The initial system prompt for the OpenAI API
 * @param  history - The history of Discord messages
 * @returns  - The history transformed into request messages
 */
export function transformHistoryToRequestMessages(
  systemPrompt: string,
  history: Message[]
): ChatCompletionRequestMessage[] {
  const context = history.map((message) => {
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

  const requestMessages = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...context,
  ] as ChatCompletionRequestMessage[];

  return requestMessages;
}

/**
 * Calculates the length of a text string in tokens using Tiktoken.
 * @param text The text to tokenize.
 * @returns The number of tokens.
 */
export function calculateTokenLength(text: string): number {
  const tokenizer = get_encoding("cl100k_base");
  const tokens = tokenizer.encode(text);
  tokenizer.free();
  return tokens.length;
}

/**
 * This function fetches messages from a channel without exceeding a token limit.
 * @param {number} messagesLimit - The maximum number of messages to fetch.
 * @param {number} MAX_TOKENS - The maximum number of tokens allowed in total.
 * @param {TextChannel} channel - The channel to fetch messages from.
 * @returns {Promise<Message[]>} - A promise that resolves to a list of messages that fit within the token limit.
 */
export async function fetchMessagesWithinTokenLimit(
  messagesLimit: number,
  MAX_TOKENS: number,
  channel: TextChannel
): Promise<Message[]> {
  // Fetch the most recent messages up to the limit
  const messages = await channel.messages.fetch({ limit: messagesLimit });

  let totalTokens = 0;
  const messageList: Message[] = [];

  // Process the messages in order from the newest
  for (let [key, message] of messages.reverse()) {
    const estimatedTokens = calculateTokenLength(message.content);

    // If the number of tokens exceeds MAX_TOKENS, stop processing
    if (totalTokens + estimatedTokens > MAX_TOKENS) {
      break;
    }

    totalTokens += estimatedTokens;
    messageList.push(message);
  }

  // Return a list of messages that does not exceed MAX_TOKENS in tokens
  return messageList;
}
