// PineconeManager.ts

import { PineconeClient } from "@pinecone-database/pinecone";
import logger from "../logger";
import {
  QueryResponse,
  UpsertResponse,
} from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";

export class PineconeManager {
  private pinecone: PineconeClient;
  private pineconeIndexName: string;

  constructor(pinecone: PineconeClient, pineconeIndexName: string) {
    this.pinecone = pinecone;
    this.pineconeIndexName = pineconeIndexName;
  }

  public async upsertData(
    id: string,
    embedding: any,
    metadata: any
  ): Promise<UpsertResponse> {
    const index = this.pinecone.Index(this.pineconeIndexName);
    const upsertRequest = {
      vectors: [
        {
          id,
          values: embedding,
          metadata,
        },
      ],
      namespace: "self-introduction",
    };
    const upsertResponse = await index.upsert({ upsertRequest });
    logger.info({ upsertResponse }, "Pinecone api upsertResponse:");
    return upsertResponse;
  }

  public async querySimilarEmbeddings(
    embedding: any,
    authorId: string
  ): Promise<QueryResponse> {
    const index = this.pinecone.Index(this.pineconeIndexName);
    const queryRequest = {
      vector: embedding,
      topK: 3,
      includeMetadata: true,
      filter: {
        author: { $ne: authorId },
      },
      namespace: "self-introduction",
    };
    const queryResponse = await index.query({
      queryRequest,
    });
    logger.info({ queryResponse }, "queryResponse:");
    return queryResponse;
  }

  public async deleteUserData(id: string): Promise<any> {
    const index = this.pinecone.Index(this.pineconeIndexName);
    const request = {
      deleteRequest: {
        filter: {
          author: { $eq: id },
        },
        namespace: "self-introduction",
      },
    };

    const response = await index._delete(request);
    logger.info({ response }, "Deleted pinecone data");
    return response;
  }
}
