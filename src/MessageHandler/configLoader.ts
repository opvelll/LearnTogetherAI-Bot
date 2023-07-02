import logger from "../logger";

// 環境変数を読み込む (開発環境の場合は.env.devを読み込む)
const envPath = process.env.NODE_ENV === "dev" ? ".env.dev" : ".env";
require("dotenv").config({
  path: envPath,
});

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
