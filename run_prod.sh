#!/bin/bash

# パス、ユーザー名、グループ名を動的に取得
LOG_DIR=$(realpath ./logs) # ログディレクトリの絶対パスを取得
USERNAME=$(id -un)
GROUP=$(id -gn)

# logrotateの設定ファイルを生成
cat > /etc/logrotate.d/mybot <<EOL
${LOG_DIR}/mybot.log {
    daily
    rotate 3
    compress
    missingok
    notifempty
    create 0640 $USERNAME $GROUP
    postrotate
        kill -HUP \`cat ${LOG_DIR}/mybot.pid\`
    endscript
}
EOL

# その他のプロダクション用のコマンドを実行
node ./build/index.js
