import { PineconeClient } from "@pinecone-database/pinecone";
import exp = require("constants");

export default async function createPineconeInstance(
  PINECONE_ENVIRONMENT: string,
  PINECONE_API_KEY: string
) {
  const pineconeClient = new PineconeClient();

  await pineconeClient.init({
    environment: PINECONE_ENVIRONMENT,
    apiKey: PINECONE_API_KEY,
  });

  return pineconeClient;
}
