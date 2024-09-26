import express = require('express');
import systemConfig from "./config/system.config";
import * as http from "node:http";
import {Judge2WebManager} from "./service/response";
import {JudgeManager} from "./service/judge/judge.manage";
import {Web2JudgeMessage} from "./types/client";
import "dotenv/config";

require('dotenv').config();

import WebSocket from 'ws';

const app = express();

const server = http.createServer(app);

// 创建 WebSocket 实例
const wsInstance = new WebSocket.Server({server});

wsInstance.on('connection', (_ws: any) => {
  if (process.env.RUNNING_LEVEL === "debug") {
    console.log("[websocket]", "client connected!");
  }

  const responseManager: Judge2WebManager = new Judge2WebManager(_ws);
  responseManager.hello();

  const judgeManager: JudgeManager = new JudgeManager(responseManager);

  _ws.on('message', (message: string) => {
    const received: Web2JudgeMessage = JSON.parse(message);

    if (process.env.RUNNING_LEVEL === "debug") {
      console.log("[websocket]", "received message. type:" + received.type);
    }

    if (received.type === "task") {
      const isReceived: boolean = judgeManager.receiveTask(received);
    } else if (received.type === "sync") {
      judgeManager.saveFile(received);
    }
  });

  _ws.on('close', () => {
    if (process.env.RUNNING_LEVEL === "debug") {
      console.log("[websocket]", "client closed!");
    }
  });
});

server.listen(systemConfig.port, () => {
  console.log("[websocket]", `the server is start at port ${systemConfig.port}`);
});
