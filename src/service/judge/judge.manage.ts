import {AssignMessage, FinishMessage, ProgressMessage} from "../../types/client";
import systemStatus from "../../config/system.status";
import {Judge2WebManager} from "../response";
import {Judge} from "./judge";

/**
 * 评测机实例管理类
 */
export class JudgeManager {
    // 用来向客户端发送信息
    private response: Judge2WebManager;

    // 评测机实例列表，长度为 systemStatus.cpus。每一个评测机实例为一个线程
    private judgeInstanceList: Judge[] = [];

    constructor(response: Judge2WebManager) {
        this.response = response;
        // 根据 cpus 数量创建评测机实例
        for (let i = 0; i < systemStatus.cpus; ++i) {
            // 确保 cpus 大于要评测的语言种类
            this.judgeInstanceList[i] = new Judge(systemStatus.langs[i / systemStatus.langs.length]);
        }

        // 每隔 3 秒同步评测信息 TODO 是否需要定时同步评测信息？
        // setInterval(() => {
        //     for (const judgeInstance of this.judgeInstanceList) {
        //         if (judgeInstance.isOccupied())
        //             this.response.judgeSync(judgeInstance.getJudgeStatus());
        //     }
        // }, 3_000);
    }

    // 接收评测任务
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
        for (const judgeInstance of this.judgeInstanceList) {
            if (judgeInstance.receive(task)) {
                // 占用的评测机实例增加
                systemStatus.occupied++;
                // Pending -> Judging
                this.response.judgeSync(judgeInstance.getJudgeStatus());
                this.response.dispatchTask("accept", task.id);
                // 不阻塞主进程的执行
                this.judge(task, judgeInstance).then(_ => {});
                return true;
            }
        }
        this.response.dispatchTask("reject", task.id);
        return false;
    }

    // 开始评测
    private judge = async (task: AssignMessage, judgeInstance: Judge) => {
        const compileResult: boolean = await judgeInstance.compile(task);
        // Judging -> Compiling
        this.response.judgeSync(judgeInstance.getJudgeStatus());
        // TODO 如果go-judge出现系统错误，这里还是会返回false
        if (!compileResult) {
            // 评测失败
            const finish: FinishMessage = judgeInstance.getJudgeStatus() as FinishMessage;
            // 占用的评测机实例减少
            systemStatus.occupied--;
            // Compiling -> Compile Error
            this.response.judgeSync(finish);
            // 重置评测机实例
            judgeInstance.reset();
        }
        const running: ProgressMessage = judgeInstance.getJudgeStatus() as ProgressMessage;
        // Compiling -> Running
        this.response.judgeSync(running);
        // TODO ...
    }
}