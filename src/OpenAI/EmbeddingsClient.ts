import { CreateEmbeddingResponse, OpenAIApi } from "openai";
import ChatCompletionClient from "./ChatCompletionClient";

class EmbeddingsClient extends ChatCompletionClient {
  constructor(openai: OpenAIApi) {
    super(openai);
  }

  async createEmbedding(texts: string[]): Promise<number[]> {
    const response = await this.openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: texts,
    });
    return response.data.data[0].embedding;
  }
}

export default EmbeddingsClient;
