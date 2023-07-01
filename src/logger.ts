// logger.ts
import pino from "pino";
import fs from "fs";
import path from "path";

// 開発環境かどうかをチェック
const isDevEnv = process.env.NODE_ENV === "dev";

let logger: pino.Logger;

if (isDevEnv) {
  logger = pino({
    transport: {
      target: "pino-pretty",
    },
  });
} else {
  // 絶対パスを使用してlogsディレクトリを指定
  const logsDir = path.resolve(__dirname, "..", "logs");

  // logsディレクトリが存在しない場合は作成
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // プロセスIDをファイルに書き込む
  const pidFilePath = path.join(logsDir, "mybot.pid");
  fs.writeFileSync(pidFilePath, process.pid.toString());

  // ロガーを初期化
  const logFilePath = path.join(logsDir, "mybot.log");
  const dest = pino.destination(logFilePath);
  logger = pino(dest);

  // SIGHUPシグナルを受信したときにログファイルを再オープン
  process.on("SIGHUP", () => dest.reopen());
}

export default logger;
