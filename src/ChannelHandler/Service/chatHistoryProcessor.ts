import { get_encoding } from "@dqbd/tiktoken";
import {
  CommandInteraction,
  Interaction,
  Message,
  TextChannel,
} from "discord.js";
import { ChatCompletionRequestMessage } from "openai";

// Filter messages by user or bot with a reference to the user's message
export async function filterUserAndBotMessages(
  messagesLimit: number,
  userMessage: Message | CommandInteraction
): Promise<Map<string, Message>> {
  // Get the channel and fetch the messages
  const channel = userMessage.channel as TextChannel;
  const messages = await channel.messages.fetch({ limit: messagesLimit });

  // Get the user's ID
  const userId =
    userMessage instanceof Message
      ? userMessage.author.id
      : userMessage.user.id;

  // Create a map of messages sent by the user
  const messageMap = messages
    .filter((msg) => msg.author.id === userId)
    .reduce((map, message) => map.set(message.id, message), new Map());

  // Filter messages to include only those sent by the user or a bot referencing the user's message
  const context = messages.filter((msg) => {
    const isUserMessage = msg.author.id === userId;
    const isBotReference =
      msg.author.bot &&
      msg.reference &&
      messageMap.has(msg.reference.messageId);
    return isUserMessage || isBotReference;
  });

  return context;
}

/**
 * Fetches messages from a user and any bot messages that reference the user's messages.
 *
 * @param messagesLimit - The maximum number of messages to fetch from the channel.
 * @param userMessage - A message or interaction from the user to be used for identifying the user and the channel.
 * @returns An array of messages involving the user and bot, ordered from the most recent to the oldest.
 */
export async function fetchUserAndBotConversations(
  messagesLimit: number,
  userMessage: Message | CommandInteraction
): Promise<Message[]> {
  const context = await filterUserAndBotMessages(messagesLimit, userMessage);
  return Array.from(context.values()).reverse();
}

/**
 * Fetches a list of messages based on a token limit, includes messages from a user and any bot messages that reference the user's messages.
 *
 * @param messagesLimit - The maximum number of messages to fetch from the channel.
 * @param MAX_TOKENS - The maximum number of tokens allowed in the fetched messages.
 * @param userMessage - A message from the user to be used for identifying the user and the channel.
 * @returns An array of messages within the token limit, involving the user and bot, ordered from the most recent to the oldest.
 */
export async function fetchConversationsWithTokenLimit(
  messagesLimit: number,
  MAX_TOKENS: number,
  userMessage: Message
): Promise<Message[]> {
  const context = await filterUserAndBotMessages(messagesLimit, userMessage);

  let totalTokens = 0;
  const messageList: Message[] = [];

  // Iterate through the context messages and add to the list until token limit is reached
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
