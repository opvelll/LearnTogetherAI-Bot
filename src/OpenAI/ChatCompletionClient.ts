import {
  ChatCompletionRequestMessage,
  ChatCompletionResponseMessage,
  OpenAIApi,
} from "openai";
import logger from "../logger";

class ChatCompletionClient {
  private openai: OpenAIApi; // Instance to use OpenAI's API

  constructor(openai: OpenAIApi) {
    this.openai = openai;
  }

  /**
   * Calls the ChatCompletion API.
   * @param messages The messages to be sent to the ChatCompletion API.
   * @returns The ChatCompletion response message.
   * @throws {Error} If the API call is unsuccessful or the response is in an incorrect format.
   */
  async chatCompletion(
    messages: ChatCompletionRequestMessage[]
  ): Promise<ChatCompletionResponseMessage> {
    try {
      logger.info(messages, "Starting API call");

      // Send a request to the OpenAI API
      const response = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
      });

      // Log the received response
      logger.info(
        { responseMessage: response.data.choices[0].message },
        "Received response"
      );

      // Throw an error if the response is in an incorrect format
      if (!response.data.choices[0].message) {
        throw new Error(
          `Failed to fetch completion from ChatGPT API, received an unexpected response format: ${JSON.stringify(
            response
          )}`
        );
      }

      return response.data.choices[0].message;
    } catch (error: any) {
      // Log the error
      logger.error(
        { error, errorResponse: error.response },
        "Failed to fetch completion from ChatGPT API"
      );
      throw error;
    }
  }
}

export default ChatCompletionClient;
