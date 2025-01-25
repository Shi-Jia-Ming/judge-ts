import {AssignMessage, SyncResponseMessage} from "../../types/client";
import systemStatus from "../../config/system.status";
import {Judge2WebManager} from "../response";
import {Judge} from "./judge";
import FileManager from "../file.manage";
import Logger from "../../utils/logger";

/**
 * 评测机实例管理类
 */
export class JudgeManager {
  // 用来向客户端发送信息
  private response: Judge2WebManager;
  // 用来请求文件
  private fileManager: FileManager;

  // 评测机实例列表，长度为 systemStatus.cpus。每一个评测机实例为一个线程
  private judgeInstanceList: Judge[] = [];

  private readonly logger: Logger = new Logger("judge manager");

  constructor(response: Judge2WebManager, fileManager: FileManager) {
    this.response = response;
    this.fileManager = fileManager;
    // 根据 cpus 数量创建评测机实例
    for (let i = 0; i < systemStatus.cpus; ++i) {
      // 确保 cpus 大于要评测的语言种类
      this.judgeInstanceList[i] = new Judge(systemStatus.langs[i % systemStatus.langs.length], i);
    }
  }

  /**
   * 向目标评测机分发文件
   * @param file 获取的文件
   * @param instanceId 请求该文件的评测机实例id
   */
  public saveFile = (file: SyncResponseMessage, instanceId: number) => {
    // this.fileList.set(file.uuid, Buffer.from(file.data, "base64").toString());
    const instance = this.judgeInstanceList.find((instance) => instance.id === instanceId);
    if (instance) {
      instance.saveFile(file);
    }
  }

  /**
   * 接收评测任务
   * @param task 评测任务
   * @returns 是否成功接收，如果评测机实例被占用或者不支持该编程语言，返回 false
   */
  public receiveTask = (task: AssignMessage): boolean => {
    // 判断编程语言
    // 判断资源占用情况
    if (
      !systemStatus.langs.includes(task.language) ||
      systemStatus.cpus <= systemStatus.occupied
    ) {
      this.response.dispatchTask("reject", task.id);
      return false;
    }
    // 接取任务
    for (const judgeInstance of this.judgeInstanceList.filter((judgeInstance) => !judgeInstance.isOccupied())) {
      if (judgeInstance.receive(task)) {
        this.logger.info(`assign task ${task.id} to judge instance ${judgeInstance.id}`);
        // 占用的评测机实例增加
        systemStatus.occupied++;
        // Pending -> Judging
        this.response.judgeSync(judgeInstance.getJudgeStatus());
        this.response.dispatchTask("accept", task.id);
        // 不阻塞主进程的执行
        this.judge(task, judgeInstance).catch((_) => {
          this.logger.error(`judge task ${task.id} error`);

          this.response.judgeSync({
            type: "finish",
            id: task.id,
            result: {
              message: "",
              status: "System Error",
              score: 0,
              /** 所有子任务结果 */
              subtasks: []
            }
          })
        });

        return true;
      }
    }

    this.logger.info(`no available judge instance`);

    this.response.dispatchTask("reject", task.id);
    return false;
  }

  // 开始评测
  private judge = async (task: AssignMessage, judgeInstance: Judge) => {
    this.logger.info(`start judge task ${task.id}`);
    // Judging -> Compiling
    this.response.judgeSync(judgeInstance.getJudgeStatus());

    const compileResult: boolean = await judgeInstance.compile(task);
    // Compiling -> Compile Error | System Error | Running
    this.response.judgeSync(judgeInstance.getJudgeStatus());

    // TODO 如果go-judge出现系统错误，这里不会有特殊的处理
    if (!compileResult) {
      // 编译失败
      // 占用的评测机实例减少
      systemStatus.occupied--;
      // 重置评测机实例
      judgeInstance.reset();
      return;
    }

    // 编译成功，准备运行

    // 解析 config.json 文件
    this.fileManager.requestFile(task.files["config.json"], judgeInstance.id);
    await new Promise((resolve) => {
      const timer = setInterval(() => {
        const configJson: string | undefined = judgeInstance.fileList.get(task.files["config.json"]);
        if (configJson !== undefined) {
          judgeInstance.configure(configJson);
        }

        if (judgeInstance.isConfigured()) {
          clearInterval(timer);
          resolve(null);
        }
      }, 1000);
    });

    // 从客户端获取评测需要的文件
    for (let filesKey in task.files) {
      if (filesKey === "config.json") continue;
      this.fileManager.requestFile(task.files[filesKey], judgeInstance.id);
    }

    await new Promise((resolve) => {
      const timer = setInterval(async () => {
        // TODO 错误检测的优化
        await judgeInstance.run(judgeInstance.fileList, task).catch((e) => {
          this.logger.error('execute error', e);

          this.response.judgeSync({
            type: "finish",
            id: task.id,
            result: {
              message: e.message,
              status: "System Error",
              score: 0,
              /** 所有子任务结果 */
              subtasks: []
            }
          })
        });
        if (judgeInstance.isAllSubTaskFinished()) {
          this.logger.info(`all subtask finished`);
          clearInterval(timer);
          resolve(null);      // 执行 then
        }
      }, 1000);
    });
    this.response.judgeSync(judgeInstance.getJudgeStatus());
    systemStatus.occupied--;
    judgeInstance.reset();
  }
}