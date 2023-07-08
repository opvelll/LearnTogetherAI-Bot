import { Configuration, OpenAIApi } from "openai";

export default function createOpenAIApiInstance(
  OPENAI_ORGANIZATION_ID: string,
  OPENAI_API_KEY: string
): OpenAIApi {
  // OpenAI APIの設定
  const configuration = new Configuration({
    organization: OPENAI_ORGANIZATION_ID,
    apiKey: OPENAI_API_KEY,
  });

  return new OpenAIApi(configuration); // OpenAI APIクライアントを初期化
}
