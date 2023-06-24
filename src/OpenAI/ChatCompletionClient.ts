import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  OpenAIApi,
} from "openai";

class ChatCompletionClient {
  private openai: OpenAIApi; // OpenAIのAPIを使うためのインスタンス

  constructor(openai: OpenAIApi) {
    this.openai = openai;
  }

  // ChatCompletionのAPIを呼び出す
  async chatCompletion(
    messages: ChatCompletionRequestMessage[]
  ): Promise<ChatCompletionResponseMessage> {
    try {
      console.log("API呼び出しを開始します。メッセージ:", messages); // API呼び出し前のログ

      // OpenAI APIにリクエストを送る
      const response = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
      });

      // 応答が不正な場合はエラーを投げる
      if (response.data.choices[0].message === undefined) {
        throw new Error(
          `Failed to fetch completion from ChatGPT API: ${response.statusText}`
        );
      }

      console.log("応答を受け取りました:", response.data.choices[0].message); // 応答後のログ

      return response.data.choices[0].message;
    } catch (error: any) {
      console.error(
        `ChatGPT APIからの応答の取得に失敗しました: ${error.message}, 応答: ${error.response}`
      ); // エラーログ
      throw error;
    }
  }
}

export default ChatCompletionClient;
