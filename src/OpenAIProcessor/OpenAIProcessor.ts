import { OpenAIApi } from "openai";
import { ChatCompletionPatterns } from "./ChatCompletionPatterns";

class OpenAIProcessor extends ChatCompletionPatterns {
  constructor(openai: OpenAIApi) {
    super(openai);
  }

  async createEmbedding(texts: string[]) {
    return await this.embeddingsClient.createEmbedding(texts);
  }
}

export default OpenAIProcessor;
