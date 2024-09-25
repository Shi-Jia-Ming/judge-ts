import express = require('express');
import systemConfig from "./config/system.config";
import * as http from "node:http";
import {Judge2WebManager} from "./service/response";
import {JudgeManager} from "./service/judge/judge.manage";
import {Web2JudgeMessage} from "./types/client";

import WebSocket from 'ws';

const app = express();

const server = http.createServer(app);

// 创建 WebSocket 实例
const wsInstance = new WebSocket.Server({server});

wsInstance.on('connection', (_ws: any) => {
  console.log("Client connected!");

  const responseManager: Judge2WebManager = new Judge2WebManager(_ws);
  responseManager.hello();

  const judgeManager: JudgeManager = new JudgeManager(responseManager);

  _ws.on('message', (message: string) => {
    console.log('Received message：' + message);

    const received: Web2JudgeMessage = JSON.parse(message);
    if (received.type === "task") {
      const isReceived: boolean = judgeManager.receiveTask(received);
      console.log("Is task received: ", isReceived);
    } else if (received.type === "sync") {
      judgeManager.saveFile(received);
    }
  });

  _ws.on('close', () => {
    console.log("Client closed!");
  });
});

server.listen(systemConfig.port, () => {
  console.log(`the server is start at port ${systemConfig.port}`);
});
