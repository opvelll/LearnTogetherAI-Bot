import { CreateEmbeddingResponse, OpenAIApi } from "openai";

class EmbeddingsClient {
  constructor(private openai: OpenAIApi) {}

  async createEmbedding(texts: string[]): Promise<number[]> {
    const response = await this.openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: texts,
    });
    return response.data.data[0].embedding;
  }
}

export default EmbeddingsClient;
