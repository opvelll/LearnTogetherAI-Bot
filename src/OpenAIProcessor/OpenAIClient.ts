import ChatCompletionClient from "../OpenAI/ChatCompletionClient";
import OpenAIConfigurator from "../OpenAI/OpenAIConfigurator";
import EmbeddingsClient from "../OpenAI/EmbeddingsClient";
import { OpenAIApi } from "openai";

export class OpenAIClient {
  chatCompletionClient: ChatCompletionClient;
  protected embeddingsClient: EmbeddingsClient;

  constructor(openai: OpenAIApi) {
    this.chatCompletionClient = new ChatCompletionClient(openai);
    this.embeddingsClient = new EmbeddingsClient(openai);
  }
}
