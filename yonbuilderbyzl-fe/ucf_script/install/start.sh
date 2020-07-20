#!/bin/bash
# 基础目录
bashpath=$(cd "$(dirname "$0")"; pwd)
export NODE_ENV="production"
export PREFIX="/developplatform"
export SERVER_PORT=${node_PORT}
# 切换目录
cd ${bashpath}
# 执行权限
#chmod 777 -R node_modules/
# 自定义端口替换。
#sed -i "s/\${NODEJS.PORT}/${node_PORT}/g" package.json
# 启动服务
#nohup npm run start >stdout.log 2>stderr.log &
nohup node bin.js >stdout.log 2>stderr.log &