import {
  ChannelHandler,
  GreetingChannelHandler,
} from "../ChannelHandler/GreetingChannelHandler";
import { SearchChannelHandler } from "../ChannelHandler/SearchChannelHandler";
import { QuestionChannelHandler } from "../ChannelHandler/QuestionChannelHandler";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";
import Pinecone from "../Pinecone/Pinecone";
import {
  CHANNEL_ID_GREETING,
  CHANNEL_ID_QUESTION,
  CHANNEL_ID_SEARCH,
} from "./configLoader";
import { PineconeClient } from "@pinecone-database/pinecone";

export default async function initChannelActions(
  openAIProcessor: OpenAIProcessor,
  pinecone: PineconeClient
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
      new SearchChannelHandler(openAIProcessor, pinecone)
    );
  }
  return channelActions;
}
