import logger from "../logger";

export type ConfigData = {
  CHANNEL_ID_GREETING: string | undefined;
  CHANNEL_ID_QUESTION: string | undefined;
  CHANNEL_ID_WORK_PLAN: string | undefined;
  CHANNEL_ID_SELF_INTRO: string | undefined;
  PINECONE_INDEX_NAME: string;
};

export function configLoader(): ConfigData {
  const {
    CHANNEL_ID_GREETING,
    CHANNEL_ID_QUESTION,
    CHANNEL_ID_WORK_PLAN,
    CHANNEL_ID_SELF_INTRO,
    PINECONE_INDEX_NAME,
  } = process.env;
  // すべての環境変数が設定されていない場合はエラーを投げる
  if (
    !CHANNEL_ID_GREETING &&
    !CHANNEL_ID_QUESTION &&
    !CHANNEL_ID_WORK_PLAN &&
    !CHANNEL_ID_SELF_INTRO
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

  return {
    CHANNEL_ID_GREETING,
    CHANNEL_ID_QUESTION,
    CHANNEL_ID_WORK_PLAN,
    CHANNEL_ID_SELF_INTRO,
    PINECONE_INDEX_NAME,
  };
}
