import logger from "../logger";

export type ConfigData = {
  [key: string]: any;
  CHANNEL_ID_GREETING: string | undefined;
  CHANNEL_ID_QUESTION: string | undefined;
  CHANNEL_ID_WORK_PLAN: string | undefined;
  CHANNEL_ID_WORK_PLAN2: string | undefined;
  CHANNEL_ID_SELF_INTRO: string | undefined;
  CHANNEL_ID_TRANSLATION: string | undefined;
  CHANNEL_ID_CHANNEL_SUGGESTIONS: string | undefined;
  CHANNEL_ID_MOKUMOKU_CATEGORY: string | undefined;

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
    CHANNEL_ID_TRANSLATION,
    CHANNEL_ID_CHANNEL_SUGGESTIONS,
    CHANNEL_ID_MOKUMOKU_CATEGORY,

    PINECONE_INDEX_NAME,
    PINECONE_ENVIRONMENT,
    PINECONE_API_KEY,

    OPENAI_ORGANIZATION_ID,
    OPENAI_API_KEY,
  } = process.env;

  // どれか一つでも環境変数が設定されていなければエラーを投げる
  if (
    !CHANNEL_ID_GREETING &&
    !CHANNEL_ID_QUESTION &&
    !CHANNEL_ID_WORK_PLAN &&
    !CHANNEL_ID_SELF_INTRO &&
    !CHANNEL_ID_WORK_PLAN2 &&
    !CHANNEL_ID_TRANSLATION &&
    !CHANNEL_ID_CHANNEL_SUGGESTIONS &&
    !CHANNEL_ID_MOKUMOKU_CATEGORY
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
    CHANNEL_ID_TRANSLATION,
    CHANNEL_ID_CHANNEL_SUGGESTIONS,
    CHANNEL_ID_MOKUMOKU_CATEGORY,

    PINECONE_INDEX_NAME,
    PINECONE_ENVIRONMENT,
    PINECONE_API_KEY,

    OPENAI_ORGANIZATION_ID,
    OPENAI_API_KEY,
  };
}
