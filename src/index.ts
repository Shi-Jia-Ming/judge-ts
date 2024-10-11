import express = require('express');
import systemConfig from "./config/system.config";
import * as http from "node:http";
import {Judge2WebManager} from "./service/response";
import {JudgeManager} from "./service/judge/judge.manage";
import {Web2JudgeMessage} from "./types/client";

const WebSocket = require('ws');
const app =express();
const server = http.createServer(app);
const {v4 : uuid} = require('uuid')
const wsInstance = new WebSocket.Server({server})

// 存储客户端实例
const clients = new Map();

wsInstance.on('connection', (_ws:any) => {
  console.log("Client connected");
  // 生成client id
  const clientId = generateClientId(_ws);
  // 创建管理器实例
  const responseManager = new Judge2WebManager(_ws);
  const judgeManager: JudgeManager = new JudgeManager(responseManager);
  // 存储
  clients.set(clientId, {responseManager, judgeManager});
  responseManager.hello();

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
    console.log(`Client ${clientId} closed!`);
    clients.delete(clientId)
  });
})

server.listen(systemConfig.port, () => {
  console.log(`the server is start at port ${systemConfig.port}`)
})


const generateClientId = (ws:any) => {
  // 检查 upgradeReq 是否存在
  if (ws.upgradeReq && ws.upgradeReq.headers) {
    return ws.upgradeReq.headers['sec-websocket-key'];
  }

  // 如果 upgradeReq 不存在，使用 uuid 生成唯一标识符
  return uuid();
}