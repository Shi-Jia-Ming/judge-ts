import express = require('express');
import systemConfig from "./config/system.config";
import * as http from "node:http";
import {Judge2WebManager} from "./service/response";
import {JudgeManager} from "./service/judge/judge.manage";
import {Judge2WebMessage, Web2JudgeMessage} from "./types/client";

const WebSocket = require('ws');

const app =express();

const server = http.createServer(app);

// 创建 WebSocket 实例
const wsInstance = new WebSocket.Server({ server });
wsInstance.on('connection', (_ws: any) => {
  console.log("客户端已连接");

  const responseManager: Judge2WebManager = new Judge2WebManager(_ws);
  responseManager.hello();

  const judgeManager: JudgeManager = new JudgeManager(responseManager);

  _ws.on('message', (message: string) => {
    console.log('收到消息：' + message);
    const received: Web2JudgeMessage = JSON.parse(message);
    if (received.type === "task") {
      const isReceived: boolean = judgeManager.receiveTask(received);
      console.log("isReceived: ", isReceived);
    }
  });

  _ws.on('close', () => {
    console.log("客户端连接关闭");
  });
});

server.listen(systemConfig.port, () => {
  console.log(`the server is start at port ${systemConfig.port}`);
});
