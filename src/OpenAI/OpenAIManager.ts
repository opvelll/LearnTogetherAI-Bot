import { OpenAIApi } from "openai";
import EmbeddingsClient from "./EmbeddingsClient";

export class OpenAIManager extends EmbeddingsClient {
  constructor(openai: OpenAIApi) {
    super(openai);
  }
}
