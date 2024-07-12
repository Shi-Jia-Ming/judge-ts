import {AssignMessage, DispatchTask, FinishMessage, JudgeResult, ProgressMessage} from "../../types/client";
import {JudgeCpp} from "./language/judge.cpp";

/**
 * 评测机类
 */
export class Judge {
    // 支持的语言
    private readonly language: string;
    // 是否被占用
    private occupied: boolean;
    // 评测结果
    private readonly judgeResult: JudgeResult;
    // 评测状态
    private readonly judgeStatus: FinishMessage | ProgressMessage;

    constructor(language: string) {
        this.language = language;
        this.occupied = false;

        this.judgeResult = {
            message: '',
            status: "Pending",
            score: 0,
            subtasks: []
        };

        this.judgeStatus = {
            type: "finish",
            id: -1,
            result: this.judgeResult
        };
    }

    /**
     * 获取评测状态
     */
    public getJudgeStatus = (): FinishMessage | ProgressMessage => {
        return this.judgeStatus;
    }

    /**
     * 评测机是否有评测任务
     */
    public isOccupied = (): boolean => {
        return this.occupied;
    }

    /**
     * 重置评测机状态
     */
    public reset = () => {
        this.occupied = false;
        this.judgeResult.message = '';
        this.judgeResult.status = "Pending";
        this.judgeResult.score = 0;
        this.judgeResult.subtasks.splice(0);
        this.judgeStatus.type = "finish";
        this.judgeStatus.id = -1;
    }

    /**
     * 接收任务
     *
     * @param task 任务内容
     * @return 是否接取任务
     */
    public receive = (task: AssignMessage): boolean => {
        if (task.language === this.language && !this.occupied) {
            this.occupied = true;
            this.judgeResult.status = "Judging";
            this.judgeStatus.type = "progress";
            this.judgeStatus.id = task.id;
            return true;
        }
        return false;
    }

    /**
     * 执行任务1：编译代码
     *
     * @param task 任务内容
     * @return 编译的结果
     */
    public compile = async (task: AssignMessage): Promise<boolean>  => {
        this.judgeResult.status = "Compiling";

        const compileTask: DispatchTask = {
            id: task.id,
            code: task.code,
            language: task.language,
            files: task.files
        };

        const output: {code: number, message: string} = await JudgeCpp.judge(compileTask);

        if (output.code === 1) {
            // 编译错误
            this.judgeResult.message = output.message;
            this.judgeResult.status = "Compile Error"
            this.judgeStatus.type = "finish";
            return false;
        } else if (output.code === 2) {
            // 请求评测机错误，系统错误
            console.error(output.message);
            return false;
        } else if (output.code === 0) {
            // 编译成功
            this.judgeResult.message = output.message;
            this.judgeResult.status = "Running";
            return true;
        } else {
            // 系统错误
            console.error("Unknown compile result: ", output.message);
            return false;
        }
    }
}