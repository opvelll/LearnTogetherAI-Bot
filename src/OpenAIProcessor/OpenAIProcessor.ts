import { ChatCompletionPatterns } from "./ChatCompletionPatterns";

class OpenAIProcessor extends ChatCompletionPatterns {
  constructor() {
    super();
  }

  async createEmbedding(texts: string[]) {
    return await this.embeddingsClient.createEmbedding(texts);
  }
}

export default OpenAIProcessor;
