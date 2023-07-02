import logger from "../logger";

const { CHANNEL_ID_GREETING, CHANNEL_ID_QUESTION, CHANNEL_ID_SEARCH } =
  process.env;
// すべての環境変数が設定されていない場合はエラーを投げる
if (!CHANNEL_ID_GREETING && !CHANNEL_ID_QUESTION && !CHANNEL_ID_SEARCH) {
  const errorMessage =
    "None of the required environment variables are set.(channel id)";
  logger.error(errorMessage);
  throw new Error(errorMessage);
}

export { CHANNEL_ID_GREETING, CHANNEL_ID_QUESTION, CHANNEL_ID_SEARCH };
