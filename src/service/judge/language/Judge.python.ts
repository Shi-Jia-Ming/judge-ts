import { DispatchTask } from "../../../types/client";
import { FileError, JudgeRequest, Result } from "../../../types/server";
import axios from "axios";

export class JudgePython {
    // 准备并运行 Python 代码
    // public static judge = async (task: DispatchTask): Promise<{ code: number, message: string, fileId: string }> => {
    //     const judgeTask: JudgeRequest = {
    //         cmd: [{
    //             args: ["/usr/bin/python3", "a.py"], // 使用 python3 执行 a.py
    //             env: ["PATH=/usr/bin:/bin"], // 设置环境变量
    //             files: [{
    //                 content: "" // 兼容性保留
    //             }, {
    //                 name: "stdout",
    //                 max: 10240,
    //             }, {
    //                 name: "stderr",
    //                 max: 10240,
    //             }],
    //             cpuLimit: 10000000000, // CPU时间限制为10秒
    //             memoryLimit: 104857600, // 内存限制为100MB
    //             procLimit: 50, // 限制50进程
    //             copyIn: {
    //                 "a.py": {
    //                     content: task.code // 用户代码写入a.py
    //                 }
    //             },
    //             copyOutCached: ["a.py"],
    //             copyOut: ["stdout", "stderr"]
    //         }]
    //     };
    //
    //     let output: string = "Run done!";
    //     let fileId: string = '';
    //     let code: number = 0;
    //     await axios.post<Result[]>('http://localhost:5050/run', judgeTask).then((response) => {
    //         if (response.data[0].files !== undefined && response.data[0].files["stderr"] !== "") {
    //             output = response.data[0].files["stderr"];
    //             code = 1;
    //         } else {
    //             fileId = response.data[0].fileIds!["a.py"];
    //         }
    //     }).catch((error) => {
    //         output = String('Bad request in run: ' + error.message);
    //         code = 2;
    //     });
    //     console.log(fileId)
    //     return { code: code, message: output, fileId: fileId };
    // }

    // 运行 Python 代码
    public static exec = async (input: string, task: DispatchTask): Promise<{ code: number, output: string, runtime: number, memory: number }> => {
        const execTask: JudgeRequest = {
            cmd: [{
                args: ["/usr/bin/python3", "a.py"], // 使用 python3 执行 a.py
                env: ["PATH=/usr/bin:/bin"],
                files: [{
                    content: input
                }, {
                    name: "stdout",
                    max: 10240,
                }, {
                    name: "stderr",
                    max: 10240,
                }],
                cpuLimit: 10000000000,
                memoryLimit: 104857600,
                procLimit: 50,
                copyIn: {
                    "a.py": {
                        content: task.code
                    }
                }
            }]
        };

        let output: string = '';
        let code: number = 0;
        let runtime: number = 0;
        let memory: number = 0;
        await axios.post<Result[]>('http://localhost:5050/run', execTask).then((response) => {
            if (response.data[0].error !== undefined) {
                // 运行时错误
                output = response.data[0].error;
                code = 1;
            } else if (response.data[0].files !== undefined && response.data[0].files["stderr"] !== "") {
                // 运行时错误
                output = response.data[0].files["stderr"];
                code = 1;
            } else if (response.data[0].fileError !== undefined) {
                // 系统错误
                console.error("System error: ");
                response.data[0].fileError.forEach((error: FileError) => {
                    console.error(error.message);
                });
                code = 2;
            } else if (response.data[0].exitStatus === 0) {
                // 运行成功
                output = response.data[0].files!["stdout"];
                runtime = response.data[0].time;
                memory = response.data[0].memory;
            } else {
                console.error("Unknown error!");
                code = 2;
            }
        }).catch((error) => {
            output = String('Bad request in exec: ' + error.message);
            code = 2;
        });

        return { code: code, output: output, runtime: runtime, memory: memory };
    }
}