import logger from "../logger";

export type ConfigData = {
  CHANNEL_ID_GREETING: string | undefined;
  CHANNEL_ID_QUESTION: string | undefined;
  CHANNEL_ID_WORK_PLAN: string | undefined;
  CHANNEL_ID_WORK_PLAN2: string | undefined;
  CHANNEL_ID_SELF_INTRO: string | undefined;

  PINECONE_INDEX_NAME: string;
  PINECONE_ENVIRONMENT: string;
  PINECONE_API_KEY: string;

  OPENAI_ORGANIZATION_ID: string;
  OPENAI_API_KEY: string;
};

export function configLoader(): ConfigData {
  const {
    CHANNEL_ID_GREETING,
    CHANNEL_ID_QUESTION,
    CHANNEL_ID_WORK_PLAN,
    CHANNEL_ID_WORK_PLAN2,
    CHANNEL_ID_SELF_INTRO,

    PINECONE_INDEX_NAME,
    PINECONE_ENVIRONMENT,
    PINECONE_API_KEY,

    OPENAI_ORGANIZATION_ID,
    OPENAI_API_KEY,
  } = process.env;
  // すべての環境変数が設定されていない場合はエラーを投げる
  if (
    !CHANNEL_ID_GREETING &&
    !CHANNEL_ID_QUESTION &&
    !CHANNEL_ID_WORK_PLAN &&
    !CHANNEL_ID_SELF_INTRO &&
    !CHANNEL_ID_WORK_PLAN2
  ) {
    const errorMessage =
      "None of the required environment variables are set.(channel id)";
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  if (PINECONE_INDEX_NAME === undefined) {
    const message = "環境変数PINECONE_INDEX_NAMEが設定されていません。";
    logger.error(message);
    throw new Error(message);
  }

  if (!PINECONE_ENVIRONMENT || !PINECONE_API_KEY) {
    throw new Error(
      "Missing required environment variables PINECONE_ENVIRONMENT or PINECONE_API_KEY"
    );
  }

  // organizationIdまたはapiKeyがなければエラーを投げる
  if (!OPENAI_ORGANIZATION_ID || !OPENAI_API_KEY) {
    throw new Error(
      "Missing required environment variables OPENAI_ORGANIZATION_ID or OPENAI_API_KEY"
    );
  }

  return {
    CHANNEL_ID_GREETING,
    CHANNEL_ID_QUESTION,
    CHANNEL_ID_WORK_PLAN,
    CHANNEL_ID_WORK_PLAN2,
    CHANNEL_ID_SELF_INTRO,
    PINECONE_INDEX_NAME,
    PINECONE_ENVIRONMENT,
    PINECONE_API_KEY,
    OPENAI_ORGANIZATION_ID,
    OPENAI_API_KEY,
  };
}
