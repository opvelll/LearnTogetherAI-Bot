import ChatCompletionClient from "../OpenAI/ChatCompletionClient";
import OpenAIConfigurator from "../OpenAI/OpenAIConfigurator";
import EmbeddingsClient from "../OpenAI/EmbeddingsClient";

export class OpenAIClient {
  chatCompletionClient: ChatCompletionClient;
  protected embeddingsClient: EmbeddingsClient;

  constructor() {
    const openai = OpenAIConfigurator.createOpenAIApiInstance();
    this.chatCompletionClient = new ChatCompletionClient(openai);
    this.embeddingsClient = new EmbeddingsClient(openai);
  }
}
