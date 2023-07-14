import { GreetingChannelHandler } from "../ChannelHandler/GreetingChannelHandler";
import { ChannelHandler } from "../ChannelHandler/ChannelHandler";
import { WorkPlanChannelHandler } from "../ChannelHandler/WorkPlanChannelHandler";
import { QuestionChannelHandler } from "../ChannelHandler/QuestionChannelHandler";

import { ConfigData } from "./configLoader";
import { PineconeManager } from "../Pinecone/PineconeManager";
import { IntroductionsChannelHandler } from "../ChannelHandler/IntroductionsChannelHandler";
import { WorkPlanChannelHandler2 } from "../ChannelHandler/WorkPlanChannelHandler2";
import { ResourceTranslationChannelHandler } from "../ChannelHandler/ResourceTranslationChannelHandler";
import { ChannelSuggestions } from "../ChannelHandler/ChannelSuggestions";
import { OpenAIManager } from "../OpenAI/OpenAIManager";

export default function initChannelActions(
  openAIManager: OpenAIManager,
  pineconeManager: PineconeManager,
  config: ConfigData
) {
  const channelActions = new Map<string, ChannelHandler>();

  const handlers: { [key: string]: () => ChannelHandler } = {
    CHANNEL_ID_GREETING: () => new GreetingChannelHandler(openAIManager),
    CHANNEL_ID_QUESTION: () => new QuestionChannelHandler(openAIManager),
    CHANNEL_ID_SELF_INTRO: () =>
      new IntroductionsChannelHandler(openAIManager, pineconeManager),
    CHANNEL_ID_WORK_PLAN: () =>
      new WorkPlanChannelHandler(openAIManager, pineconeManager),
    CHANNEL_ID_WORK_PLAN2: () =>
      new WorkPlanChannelHandler2(openAIManager, pineconeManager),
    CHANNEL_ID_TRANSLATION: () =>
      new ResourceTranslationChannelHandler(openAIManager),
    CHANNEL_ID_CHANNEL_SUGGESTIONS: () =>
      new ChannelSuggestions(openAIManager, config),
  };

  for (const key in handlers) {
    const channelId = config[key];
    if (channelId) {
      channelActions.set(channelId, handlers[key]());
    }
  }

  return channelActions;
}
