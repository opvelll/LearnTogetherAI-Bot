import { Configuration, OpenAIApi } from "openai";

class OpenAIConfigurator {
  static createOpenAIApiInstance(): OpenAIApi {
    const organizationId = process.env.OPENAI_ORGANIZATION_ID; // 環境変数からorganizationIdを取得
    const apiKey = process.env.OPENAI_API_KEY; // 環境変数からapiKeyを取得

    // organizationIdまたはapiKeyがなければエラーを投げる
    if (!organizationId || !apiKey) {
      throw new Error(
        "Missing required environment variables OPENAI_ORGANIZATION_ID or OPENAI_API_KEY"
      );
    }

    // OpenAI APIの設定
    const configuration = new Configuration({
      organization: organizationId,
      apiKey: apiKey,
    });

    return new OpenAIApi(configuration); // OpenAI APIクライアントを初期化
  }
}

export default OpenAIConfigurator;
