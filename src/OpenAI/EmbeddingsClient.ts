import { CreateEmbeddingResponse, OpenAIApi } from "openai";

class EmbeddingsClient {
  private openai: OpenAIApi; // OpenAIのAPIを使うためのインスタンス
  constructor(openai: OpenAIApi) {
    this.openai = openai;
  }

  async createEmbedding(texts: string[]) {
    try {
      const response = await this.openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: texts,
      });
      return response.data.data[0].embedding;
    } catch (error: any) {
      console.error(
        `Embedding APIからの応答の取得に失敗しました: ${error.message}, 応答: ${error.response}`
      ); // エラーログ
      throw error;
    }
  }
}

export default EmbeddingsClient;
