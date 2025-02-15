import {
  AcceptMessage,
  FinishMessage,
  HandshakeMessage,
  ProgressMessage,
  RejectMessage,
  StatusMessage,
  SyncMessage,
} from "../types/client";
import systemStatus from "../config/system.status";

/**
 * 服务器向客户端发送消息的句柄类
 * <p>
 * 服务端需要向客户端发送的数据主要包括：
 * 1. 握手消息：对应数据类型： <code>HandshakeMessage</code>
 *    握手消息主要包括该服务器中服务端的基本信息，在客户端请求连接服务端时由服务端向客户端发送
 * 2. 状态同步消息： 对应数据类型：<code>StatusMessage</code>
 *    状态同步消息主要包括当前服务器的状态，主要包括资源占用信息，队列信息，由服务端定时向客户端发送
 * 3. 分配任务响应消息：对应数据类型：<code>AcceptMessage</code>或<code>RejectMessage</code>
 *    在客户端遍历评测机实例并发送分配任务请求时，服务端要根据服务器状态接受或拒绝分配的任务
 * 4. 文件同步消息：对应数据类型：<code>SyncMessage</code>
 *    客户端的文件是以<code>uuid</code>的形式发送给服务端的，服务端接受到文件<code>uuid</code>后需要根据<code>uuid</code>获取文件内容
 * 5. 评测进度消息：对应数据类型：<code>ProgressMessage</code>或<code>FinishMessage</code>
 *    同步评测进度，由服务端定时发送给客户端
 */
export class Judge2WebManager {
  // WebSocket 通讯句柄
  private _ws: any;

  constructor(_ws: any) {
    this._ws = _ws;

    // 每 3 分钟向客户端同步服务器状态
    setInterval(() => {
      this.statusSync();
    }, 180_000);
  }

  /**
   * 握手消息
   */
  public hello = () => {
    const response: HandshakeMessage = {
      type: "hello",
      version: systemStatus.version,
      cpus: systemStatus.cpus,
      langs: systemStatus.langs,
      "ext-features": systemStatus["ext-features"],
    };

    this._ws.send(JSON.stringify(response));
  };

  /**
   * 服务状态同步消息
   */
  public statusSync = () => {
    const response: StatusMessage = {
      type: "status",
      cpus: systemStatus.cpus,
      occupied: systemStatus.occupied,
      queue: systemStatus.queue,
    };

    this._ws.send(JSON.stringify(response));
  };

  /**
   * 分配任务相应，响应客户端分配任务的请求
   *
   * @param type  响应的类型
   * @param id    相应的任务的 id
   */
  public dispatchTask = (type: "accept" | "reject", id: number) => {
    let response: AcceptMessage | RejectMessage = {
      type,
      id,
    };

    this._ws.send(JSON.stringify(response));
  };

  /**
   * 文件同步消息
   *
   * @param uuid 要获取的文件 uid
   */
  public fileSync = (uuid: string) => {
    const response: SyncMessage = {
      type: "sync",
      uuid: uuid,
    };

    this._ws.send(JSON.stringify(response));
  };

  /**
   * 评测结果同步
   *
   * @param response 评测结果
   */
  public judgeSync = (response: ProgressMessage | FinishMessage) => {
    this._ws.send(JSON.stringify(response));
  };
}
