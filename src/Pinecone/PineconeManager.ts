// PineconeManager.ts

import { PineconeClient } from "@pinecone-database/pinecone";
import logger from "../logger";
import {
  QueryResponse,
  UpsertResponse,
  VectorOperationsApi,
} from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import { MetadataObj } from "./MetadataObj";

type Namespace = "self-introduction" | "work-plan";

export class PineconeManager {
  private pinecone: PineconeClient;
  private pineconeIndexName: string;
  private index: VectorOperationsApi;

  constructor(pinecone: PineconeClient, pineconeIndexName: string) {
    this.pinecone = pinecone;
    this.pineconeIndexName = pineconeIndexName;
    this.index = this.pinecone.Index(this.pineconeIndexName);
  }

  public setPineconeIndexName(pineconeIndexName: string) {
    this.pineconeIndexName = pineconeIndexName;
    this.index = this.pinecone.Index(this.pineconeIndexName);
  }

  public async upsertData(
    id: string,
    embedding: any,
    metadata: MetadataObj,
    namespace: Namespace = "work-plan"
  ): Promise<UpsertResponse> {
    const upsertRequest = {
      vectors: [
        {
          id,
          values: embedding,
          metadata,
        },
      ],
      namespace: namespace,
    };
    const upsertResponse = await this.index.upsert({ upsertRequest });
    logger.info({ upsertResponse }, "Pinecone api upsertResponse:");
    return upsertResponse;
  }

  public async querySimilarEmbeddings(
    embedding: any,
    authorId: string,
    namespace: Namespace = "work-plan"
  ): Promise<QueryResponse> {
    const queryRequest = {
      vector: embedding,
      topK: 3,
      includeMetadata: true,
      filter: {
        author: { $ne: authorId },
      },
      namespace: namespace,
    };
    const queryResponse = await this.index.query({
      queryRequest,
    });
    logger.info({ queryResponse }, "queryResponse:");
    return queryResponse;
  }

  public async deleteUserData(id: string): Promise<any> {
    const response = await this.index._delete({
      deleteRequest: {
        filter: {
          author: { $eq: id },
        },
        namespace: "self-introduction",
      },
    });

    logger.info({ response }, "Deleted pinecone data");

    const response2 = await this.index._delete({
      deleteRequest: {
        filter: {
          author: { $eq: id },
        },
        namespace: "work-plan",
      },
    });

    logger.info({ response2 }, "Deleted pinecone data");
    return response;
  }
}
