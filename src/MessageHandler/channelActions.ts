import {
  ChannelHandler,
  GreetingChannelHandler,
} from "../ChannelHandler/GreetingChannelHandler";
import { SearchChannelHandler } from "../ChannelHandler/SearchChannelHandler";
import { QuestionChannelHandler } from "../ChannelHandler/QuestionChannelHandler";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";

import { ConfigData } from "./configLoader";
import { PineconeManager } from "../Pinecone/PineconeManager";

export default function initChannelActions(
  openAIProcessor: OpenAIProcessor,
  pineconeManager: PineconeManager,
  { CHANNEL_ID_GREETING, CHANNEL_ID_QUESTION, CHANNEL_ID_SEARCH }: ConfigData
) {
  const channelActions = new Map<string, ChannelHandler>();

  if (CHANNEL_ID_GREETING) {
    channelActions.set(
      CHANNEL_ID_GREETING,
      new GreetingChannelHandler(openAIProcessor)
    );
  }

  if (CHANNEL_ID_QUESTION) {
    channelActions.set(
      CHANNEL_ID_QUESTION,
      new QuestionChannelHandler(openAIProcessor)
    );
  }

  if (CHANNEL_ID_SEARCH) {
    channelActions.set(
      CHANNEL_ID_SEARCH,
      new SearchChannelHandler(openAIProcessor, pineconeManager)
    );
  }
  return channelActions;
}
