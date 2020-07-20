#!/usr/bin/env bash

# 用来切换环境，需要用到 jq 命令行工具，安装方式见: https://stedolan.github.io/jq/download/

baseDir=$(dirname "$0") # 当前文件所在目录

targetEnv=$1  # 要切换的目标环境

# ========= 合并 package.json，用env中的文件覆盖package.json中的同名字段
srcPkgJson=$baseDir/$targetEnv/package.json
tgtPkgJson=$baseDir/../package.json
tmpPkgJson=$baseDir/package.json.tmp

jq -s '.[0] * .[1]' $tgtPkgJson $srcPkgJson > $tmpPkgJson && mv $tmpPkgJson $tgtPkgJson
# =========
