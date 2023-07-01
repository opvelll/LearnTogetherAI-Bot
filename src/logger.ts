// logger.ts
import pino from "pino";

// 開発環境かどうかをチェック
const isDevEnv = process.env.NODE_ENV === "dev";

const baseLoggerConfig: pino.LoggerOptions = {
  // ログレベルの設定
  level: isDevEnv ? "debug" : "error",
};

let logger: pino.Logger;

if (isDevEnv) {
  // 開発環境の場合は pino-pretty を使って見やすく出力する
  logger = pino({
    ...baseLoggerConfig,
    transport: {
      target: "pino-pretty",
    },
  });
} else {
  // 本番環境の場合はデフォルトの設定を使用する
  logger = pino(baseLoggerConfig);
}

export default logger;
