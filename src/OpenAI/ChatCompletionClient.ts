import {
  ChatCompletionFunctions,
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

  async chatCompletionWithFunction(
    messages: ChatCompletionRequestMessage[],
    functions: ChatCompletionFunctions[]
  ) {
    logger.info(
      { messages },
      "chatCompletionWithFunction message(function_call)"
    );
    const response = await this.openai.createChatCompletion({
      model: "gpt-3.5-turbo-0613",
      messages,
      functions,
    });

    logger.info(
      { message: response.data.choices[0].message },
      "Received response message(function_call)"
    );
    return response.data.choices[0].message;
  }

  async chatCompletion0613(messages: ChatCompletionRequestMessage[]) {
    logger.info({ messages }, "chatCompletion0613 message");
    const response = await this.openai.createChatCompletion({
      model: "gpt-3.5-turbo-0613",
      messages,
    });

    logger.info(
      { message: response.data.choices[0].message },
      "Received chatCompletion0613 response message"
    );
    return response.data.choices[0].message;
  }

  // 16,384 tokens
  async chatCompletion16k(
    messages: ChatCompletionRequestMessage[]
  ): Promise<ChatCompletionResponseMessage> {
    logger.info({ messages }, "chatCompletion16k message");
    const response = await this.openai.createChatCompletion({
      model: "gpt-3.5-turbo-16k",
      messages,
    });

    logger.info(
      { message: response.data.choices[0].message },
      "Received chatCompletion16k response message"
    );

    if (!response.data.choices[0].message) {
      throw new Error("response.data.choices[0].message == undefined");
    }

    return response.data.choices[0].message;
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
      logger.info({ messages }, "Starting API call");

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
