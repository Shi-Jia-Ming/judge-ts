#!/bin/bash
echo "Starting go-judge"
./go-judge &  # 后台运行第一个命令
pid1=$!      # 获取第一个命令的进程ID

echo "Starting judge-ts"
node ./judge-ts/dist/index.js &  # 后台运行第二个命令
pid2=$!      # 获取第二个命令的进程ID
wait $pid2   # 等待第二个命令完成
wait $pid1   # 等待第一个命令完成

echo "All commands finished"