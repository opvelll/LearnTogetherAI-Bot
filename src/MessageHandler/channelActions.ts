import {
  ChannelHandler,
  GreetingChannelHandler,
} from "../ChannelHandler/GreetingChannelHandler";
import { WorkPlanChannelHandler } from "../ChannelHandler/WorkPlanCahnnelHandler";
import { QuestionChannelHandler } from "../ChannelHandler/QuestionChannelHandler";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";

import { ConfigData } from "./configLoader";
import { PineconeManager } from "../Pinecone/PineconeManager";
import { IntroductionsChannelHandler } from "../ChannelHandler/IntroductionsChannelHandler";

export default function initChannelActions(
  openAIProcessor: OpenAIProcessor,
  pineconeManager: PineconeManager,
  {
    CHANNEL_ID_GREETING,
    CHANNEL_ID_QUESTION,
    CHANNEL_ID_WORK_PLAN,
    CHANNEL_ID_SELF_INTRO,
  }: ConfigData
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

  if (CHANNEL_ID_SELF_INTRO) {
    channelActions.set(
      CHANNEL_ID_SELF_INTRO,
      new IntroductionsChannelHandler(openAIProcessor, pineconeManager)
    );
  }

  if (CHANNEL_ID_WORK_PLAN) {
    channelActions.set(
      CHANNEL_ID_WORK_PLAN,
      new WorkPlanChannelHandler(openAIProcessor, pineconeManager)
    );
  }
  return channelActions;
}
