import express = require('express');
import systemConfig from "./config/system.config";
import * as http from "node:http";
import {HandshakeMessage} from "./types/client";

const WebSocket = require('ws');

const app =express();

const server = http.createServer(app);

// 创建 WebSocket 实例
const wsInstance = new WebSocket.Server({ server });
wsInstance.on('connection', (_ws: any) => {
  console.log("客户端已连接");

  const response: HandshakeMessage = {
    type: "hello",
    version: "v0",
    cpus: 16,
    langs: ["c"],
    "ext-features": ["hello"]
  };

  _ws.send(JSON.stringify(response));
  console.log('发送消息');

  _ws.on('message', (message: any) => {
    console.log('收到消息：' + message);


});

  _ws.on('close', () => {
    console.log("客户端连接关闭");
  })
});

server.listen(systemConfig.port, () => {
  console.log(`the server is start at port ${systemConfig.port}`);
});
