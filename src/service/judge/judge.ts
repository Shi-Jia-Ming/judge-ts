import {
    AssignMessage,
    DispatchTask,
    FinishMessage,
    JudgeResult,
    ProgressMessage,
    SubtaskResult
} from "../../types/client";
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
    // 可执行文件的id
    private execFile: string;
    // 还需要执行的子任务数量
    private subTaskNum: number;
    // 运行的结果
    private runResult: "Accepted" | "Runtime Error" | "Wrong Answer" | "Time Limit Exceeded" | "Memory Limit Exceeded" | "System Error";

    constructor(language: string) {
        this.language = language;
        this.execFile = '';
        this.occupied = false;
        this.subTaskNum = 0;

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

        this.runResult = "Accepted";
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
     * 评测机是否运行所有的子任务
     */
    public isAllSubTaskFinished = (): boolean => {
        return this.subTaskNum <= 0;
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
     * 设置子任务
     *
     * @param count 子任务的数量
     */
    public setSubTask = (count: number) => {
        for (let i = 0; i < count; ++i) {
            this.judgeResult.subtasks.push({
                message: '',
                status: 'Pending',
                score: 0,
                tasks: []
            });
        }
        this.subTaskNum = count;
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

        const output: {code: number, message: string, fileId: string} = await JudgeCpp.judge(compileTask);

        if (output.code === 1) {
            // 编译错误
            this.judgeResult.message = output.message;
            this.judgeResult.status = "Compile Error"
            this.judgeStatus.type = "finish";
            return false;
        } else if (output.code === 0) {
            // 编译成功
            this.judgeResult.message = output.message;
            this.judgeResult.status = "Running";
            this.execFile = output.fileId;
            return true;
        } else {
            // 系统错误
            this.judgeResult.message = output.message;
            this.judgeResult.status = "System Error";
            this.judgeStatus.type = "progress";
            return false;
        }
    }

    /**
     * 执行任务2：运行代码
     *
     * @param fileList 文件列表，key为uuid，value为文件内容
     * @param fileDic  文件字典，key为文件名，value为uuid
     * @return 运行的结果
     */
    public run = async (fileList: Map<string, string>, fileDic: Record<string, string>): Promise<boolean> => {
        // 验证可执行文件的ID是否为空
        if (this.execFile === '') {
            console.error("The id of execFile is NULL! Please check if the compile is completed.");
            return false;
        }
        this.judgeResult.status = "Accepted";
        this.judgeResult.subtasks[this.subTaskNum - 1].status = 'Running';
        this.judgeResult.subtasks[this.subTaskNum - 1].tasks.push({
            message: '',
            status: 'Running',
            time: 0,
            memory: 0
        });

        // 获取输入文件和输出文件 TODO 通过字符串拼接的方式拼接文件内容
        const inputFileName: string = this.subTaskNum.toString() + '.in';
        const outputFileName: string = this.subTaskNum.toString() + '.out';
        const inputFileUuid: string = fileDic[inputFileName];
        const outputFileUuid: string = fileDic[outputFileName];
        // 如果fileList中没有uuid说明还没有从客户端加载
        const input: string | undefined = fileList.get(inputFileUuid);
        const output: string | undefined = fileList.get(outputFileUuid);

        if (input !== undefined && output !== undefined) {
            // 运行文件
            const out: {code: number, output: string, runtime: number, memory: number} = await JudgeCpp.exec(input, this.execFile);
            this.subTaskNum--;
            // TODO 运行时间和内存限制的检测
            if (out.code === 1) {
                // runtime error
                this.judgeResult.subtasks[this.subTaskNum].tasks[0].message = out.output;
                this.judgeResult.subtasks[this.subTaskNum].tasks[0].status = 'Runtime Error';
                this.judgeResult.subtasks[this.subTaskNum].tasks[0].time = out.runtime;
                this.judgeResult.subtasks[this.subTaskNum].tasks[0].memory = out.memory;
                return false;
            } else if (out.code === 2) {
                console.error("System error while running tasks");
                return false;
            } else if (out.code === 0) {
                // run success, compare output
                if (!this.contrast(output, out.output)) {
                    this.judgeResult.subtasks[this.subTaskNum].status = 'Wrong Answer';
                    this.judgeResult.subtasks[this.subTaskNum].tasks[0].message = out.output;
                    this.judgeResult.subtasks[this.subTaskNum].tasks[0].status = 'Wrong Answer';
                    this.judgeResult.subtasks[this.subTaskNum].tasks[0].time = out.runtime;
                    this.judgeResult.subtasks[this.subTaskNum].tasks[0].memory = out.memory;
                    this.judgeResult.status = 'Wrong Answer';
                    this.runResult = 'Wrong Answer';

                    this.judgeStatus.type = "finish";
                    return false;
                }
                this.judgeResult.subtasks[this.subTaskNum].status = 'Accepted';
                this.judgeResult.subtasks[this.subTaskNum].tasks[0].message = out.output;
                this.judgeResult.subtasks[this.subTaskNum].tasks[0].status = 'Accepted';
                this.judgeResult.subtasks[this.subTaskNum].tasks[0].time = out.runtime;
                this.judgeResult.subtasks[this.subTaskNum].tasks[0].memory = out.memory;
                this.judgeResult.score++;

                if (this.subTaskNum <= 1) {
                    this.judgeResult.status = this.runResult;
                    this.judgeStatus.type = "finish";
                }

                return true;
            }

        } else {
            console.error("Can not load file from fileMap.");
        }

        return false;
    }

    /**
     * 执行任务3：对比答案
     *
     * @param answer 正确答案
     * @param output 输出结果
     * @return 答案是否正确
     */
    public contrast = (answer: string, output: string) => {
        // TODO 对比答案只是简单的字符串对比，后续可以添加对空格、换行符等的处理
        return answer === output;
    }
}