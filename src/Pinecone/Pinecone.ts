import { PineconeClient } from "@pinecone-database/pinecone";
import exp = require("constants");

class Pinecone {
  static async init() {
    const pineconeClient = new PineconeClient();

    if (!process.env.PINECONE_ENVIRONMENT || !process.env.PINECONE_API_KEY) {
      throw new Error(
        "Missing required environment variables PINECONE_ENVIRONMENT or PINECONE_API_KEY"
      );
    }
    await pineconeClient.init({
      environment: process.env.PINECONE_ENVIRONMENT,
      apiKey: process.env.PINECONE_API_KEY,
    });

    return pineconeClient;
  }
}

export default Pinecone;
