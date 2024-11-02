import express = require('express');
import systemConfig from "./config/system.config";
import * as http from "node:http";
import {Judge2WebManager} from "./service/response";
import {JudgeManager} from "./service/judge/judge.manage";
import {Web2JudgeMessage} from "./types/client";
import "dotenv/config";

require('dotenv').config();

import WebSocket from 'ws';
import FileManager from './service/file.manage';

const app = express();

const server = http.createServer(app);
const {v4: uuid} = require('uuid')
const wsInstance = new WebSocket.Server({server})

// 存储客户端实例
const clients = new Map();

wsInstance.on('connection', (_ws: any) => {
  if (process.env.RUNNING_LEVEL === "debug") {
    console.log("[websocket]", "client connected!");
  }

  // 生成client id
  const clientId = generateClientId();
  // 创建管理器实例
  const responseManager = new Judge2WebManager(_ws);
  // TODO fileManager 和 judgeManager 的关系有点混乱
  const fileManager: FileManager = new FileManager(responseManager);
  const judgeManager: JudgeManager = new JudgeManager(responseManager, fileManager);

  // 存储
  clients.set(clientId, {responseManager, judgeManager});
  responseManager.hello();

  _ws.on('message', (message: string) => {
    const received: Web2JudgeMessage = JSON.parse(message);

    if (process.env.RUNNING_LEVEL === "debug") {
      console.log("[websocket]", "received message. type:" + received.type);
    }

    if (received.type === "task") {
      const isReceived: boolean = judgeManager.receiveTask(received);
    } else if (received.type === "sync") {
      fileManager.receiveFile(received, judgeManager);
    }
  });

  _ws.on('close', () => {
    clients.delete(clientId);
    if (process.env.RUNNING_LEVEL === "debug") {
      console.log("[websocket]", "client closed!");
    }
  });
})

server.listen(systemConfig.port, () => {
  console.log("[websocket]", `the server is start at port ${systemConfig.port}`);
});

const generateClientId = () => {
  return uuid();
}