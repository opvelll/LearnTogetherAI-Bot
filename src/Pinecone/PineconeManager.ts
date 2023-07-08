import { PineconeClient } from "@pinecone-database/pinecone";
import logger from "../logger";
import {
  QueryResponse,
  UpsertResponse,
  VectorOperationsApi,
} from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import { MetadataObj } from "./MetadataObj";

type Namespace = "self-introduction" | "work-plan";

/**
 * This class represents the main interface for interacting with a Pinecone database
 */
export class PineconeManager {
  private pineconeClient: PineconeClient;
  private pineconeIndexName: string;
  private indexOperations: VectorOperationsApi;

  /**
   * Constructs a new instance of the PineconeManager class
   * @param pineconeClient The PineconeClient object to interact with the database
   * @param pineconeIndexName The name of the index to use within the Pinecone database
   */
  constructor(pineconeClient: PineconeClient, pineconeIndexName: string) {
    this.pineconeClient = pineconeClient;
    this.pineconeIndexName = pineconeIndexName;
    this.indexOperations = this.pineconeClient.Index(this.pineconeIndexName);
  }

  /**
   * Sets a new index name for the Pinecone client
   * @param pineconeIndexName The new index name
   */
  public setPineconeIndexName(pineconeIndexName: string) {
    this.pineconeIndexName = pineconeIndexName;
    this.indexOperations = this.pineconeClient.Index(this.pineconeIndexName);
  }

  /**
   * Inserts or updates a vector in the Pinecone database
   * @param id The unique identifier of the vector
   * @param embedding The vector to insert or update
   * @param metadata The metadata associated with the vector
   * @param namespace The namespace to perform the operation in
   * @returns A Promise of the UpsertResponse from the Pinecone API
   */
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
    const upsertResponse = await this.indexOperations.upsert({ upsertRequest });
    logger.info({ upsertResponse }, "Pinecone API upsert response:");
    return upsertResponse;
  }

  /**
   * Queries the Pinecone database for vectors similar to a given vector
   * @param embedding The vector to find similar vectors to
   * @param authorId The authorId to exclude from the query
   * @param namespace The namespace to perform the query in
   * @returns A Promise of the QueryResponse from the Pinecone API
   */
  public async querySimilarEmbeddings(
    embedding: any,
    authorId: string,
    namespace: Namespace = "work-plan"
  ): Promise<QueryResponse> {
    const queryRequest = {
      vector: embedding,
      topK: 4,
      includeMetadata: true,
      filter: {
        author: { $ne: authorId },
      },
      namespace: namespace,
    };
    const queryResponse = await this.indexOperations.query({
      queryRequest,
    });
    logger.info({ queryResponse }, "Pinecone API query response:");
    return queryResponse;
  }

  /**
   * Deletes all vectors associated with a user from the Pinecone database
   * @param userId The unique identifier of the user
   * @returns A Promise of the delete response from the Pinecone API
   */
  public async deleteUserData(userId: string): Promise<any> {
    const namespaces = ["self-introduction", "work-plan"];

    for (const namespace of namespaces) {
      const response = await this.indexOperations._delete({
        deleteRequest: {
          filter: {
            author: { $eq: userId },
          },
          namespace: namespace,
        },
      });
      logger.info(
        { response },
        `Deleted pinecone data from namespace: ${namespace}`
      );
    }

    return true;
  }

  public async deleteAllData(): Promise<any> {
    const namespaces = ["self-introduction", "work-plan"];

    for (const namespace of namespaces) {
      const response = await this.indexOperations.delete1({
        deleteAll: true,
        namespace: namespace,
      });
      logger.info(
        { response },
        `Deleted all pinecone data from namespace: ${namespace}`
      );
    }

    return true;
  }
}
