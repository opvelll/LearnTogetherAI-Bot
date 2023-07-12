import { GreetingChannelHandler } from "../ChannelHandler/GreetingChannelHandler";
import { ChannelHandler } from "../ChannelHandler/ChannelHandler";
import { WorkPlanChannelHandler } from "../ChannelHandler/WorkPlanChannelHandler";
import { QuestionChannelHandler } from "../ChannelHandler/QuestionChannelHandler";
import OpenAIProcessor from "../OpenAIProcessor/OpenAIProcessor";

import { ConfigData } from "./configLoader";
import { PineconeManager } from "../Pinecone/PineconeManager";
import { IntroductionsChannelHandler } from "../ChannelHandler/IntroductionsChannelHandler";
import { WorkPlanChannelHandler2 } from "../ChannelHandler/WorkPlanChannelHandler2";
import { ResourceTranslationChannelHandler } from "../ChannelHandler/ResourceTranslationChannelHandler";
import { ChannelSuggestions } from "../ChannelHandler/ChannelSuggestions";

export default function initChannelActions(
  openAIProcessor: OpenAIProcessor,
  pineconeManager: PineconeManager,
  config: ConfigData
) {
  const channelActions = new Map<string, ChannelHandler>();

  const handlers: { [key: string]: () => ChannelHandler } = {
    CHANNEL_ID_GREETING: () => new GreetingChannelHandler(openAIProcessor),
    CHANNEL_ID_QUESTION: () => new QuestionChannelHandler(openAIProcessor),
    CHANNEL_ID_SELF_INTRO: () =>
      new IntroductionsChannelHandler(openAIProcessor, pineconeManager),
    CHANNEL_ID_WORK_PLAN: () =>
      new WorkPlanChannelHandler(openAIProcessor, pineconeManager),
    CHANNEL_ID_WORK_PLAN2: () =>
      new ChannelSuggestions(openAIProcessor, pineconeManager),
    CHANNEL_ID_TRANSLATION: () =>
      new ResourceTranslationChannelHandler(openAIProcessor),
  };

  for (const key in handlers) {
    const channelId = config[key];
    if (channelId) {
      channelActions.set(channelId, handlers[key]());
    }
  }

  return channelActions;
}
