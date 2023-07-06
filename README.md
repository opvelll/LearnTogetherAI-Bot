# LearnTogetherAI Bot

ChatGPT を活用したもくもく会をサポートする Discord ボットです。

## 機能

### チャンネル

- **ChatGPT との対話**: ChatGPT が質問に答える、または挨拶をします。
- **コラボレーション提案**: 参加者が自己紹介をしたり、取り組んでいることを共有すると、ChatGPT が同じような関心を持つ人とのコラボレーションを提案します。（この機能は少し鬱陶しいかもしれません）

### スラッシュコマンド

- /delete_mydata :DB に保存されたユーザーのデータを消去します。

現在、これは試作品であり、開発中です。

## 自分の Discord サーバーで Bot を動かす

注意:各サービス（OpenAI,Pinecone,AWS Lightsail）は料金が発生するので調べてから利用して下さい。(一応どのサービスにも初回無料枠相当のものがあります)

### 1. リポジトリをクローンする

```sh
git clone https://github.com/opvelll/LearnTogetherAI-Bot.git
cd LearnTogetherAI-Bot
```

### 2. 自分管理の Discord サーバーを２つ立てる。

自分が管理する Discord サーバーを 2 つ用意します（本番用とテスト用）。
そして今のところ三種類チャンネルがあるのでほしいチャンネルを作成します。一言チャンネル、質問チャンネル、検索チャンネル。

### 3. .env ファイルを作成する。

プロジェクトのルートディレクトリに.env ファイル（本番用）と.env.dev ファイル（テスト用）を作成します。
これらの設定で本番用、テスト用のボットの設定を分けます。

```env
DISCORD_TOKEN=
DISCORD_APPLICATION_ID=
DISCORD_PUBLIC_KEY=

OPENAI_API_KEY=
OPENAI_ORGANIZATION_ID=

CHANNEL_ID_GREETING=
CHANNEL_ID_QUESTION=
CHANNEL_ID_WORK_PLAN=

PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
PINECONE_INDEX_NAME=
PINECONE_INDEX_DIM=
PINECONE_INDEX_METRIC=
```

OpenAI や Pinecone の設定部分は使い回します。

### 4. [Discord Developer Portal](https://discord.com/developers/applications)で新しいアプリケーションを２つ作成する。

Discord Developer Portal で 2 つの新しいアプリケーションを作成し、それぞれ以下の設定を行い。

- PUBLIC BOT を OFF
- MESSAGE CONTENT INTENT を ON

そして、それぞれ.env ファイルに以下の情報をコピー＆ペーストします。

```env
DISCORD_TOKEN=
DISCORD_APPLICATION_ID=
DISCORD_PUBLIC_KEY=
```

### 5. ボットを Discord サーバーに登録する

- OAuth2 > URL Generator から bot をクリック、
- 下の欄から Read Messages/View Channels、Send Messages と Read Message History にチェックを入れる
- 生成された URL を開いて、ボットを Discord サーバーに招待する

これも本番、テストそれぞれ行う。

### 6. OpenAI platform からトークンをコピペする

OpenAI platform にアクセス Manage Account > Organaization settings から API_KEY などを、.env ファイルにコピペする。

```env
OPENAI_API_KEY=
OPENAI_ORGANIZATION_ID=
```

### 7. Pinecone にアカウント登録して、インデックスを作成

Pinecone でインデックスを作成します。設定は以下の通りです。

- dimensions は 1536
- metric は cosine

Pinecone のダッシュボードから以下の情報を.env ファイルにコピー＆ペーストします。

```env
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=
```

### 8. ローカルで起動する。

開発環境

```sh
npm install
npm run dev
```

ログが表示されるので、テスト Discord サーバーのテストボットがオンラインになるか確認する。Ctrl + c で終了。

本番ボット

```sh
npm run start
```

### 9. どこかのサーバーにデプロイする

AWS Lightsail の場合

1. AWS Lightsail で Node.js インスタンスを作成します。
2. ブラウザから SSH 接続を行います。
3. リポジトリを git クローン。移動します。
4. .env ファイルを作成して、ローカルの.env の内容をコピペします。
5. 以下のコマンドを実行します

```sh
npm install
sudo npm install pm2 -g
node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc
npm run build
npm run register
pm2 start "npm run start" --name "mybot"
```

### 10. アップデートする

AWS Lightsail の場合

```sh
pm2 stop mybot
git pull
npm run build
npm run register
pm2 start mybot
```
