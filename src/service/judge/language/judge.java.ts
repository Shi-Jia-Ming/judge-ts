import {DispatchTask} from "../../../types/client";
import {FileError, JudgeRequest, Result} from "../../../types/server";
import {response} from "express";
import axios from "axios";

export class JudgeJava{
    public static judge = async (task:DispatchTask): Promise<{code:number,message:string,fileId:string}> => {
        const judgeTask:JudgeRequest = {
            cmd:[{
                args:["/usr/bin/javac","Main.java"], // Java的文件由主类，这里使用Main
                env:["PATH=/usr/bin:/bin"],
                files:[{
                    content:"",
                },{
                    name:"stdout",
                    max:10240,
                },{
                    name:"stderr",
                    max:10240,
                }],
                cpuLimit: 10000000000, // CPU时间限制为10秒
                memoryLimit: 104857600, // 内存限制为100MB
                procLimit: 50, // 限制50进程
                copyIn: {
                    "Main.java": {
                        content: task.code // 用户代码写入 Main.java
                    }
                },
                copyOutCached: ["Main.class"],
                copyOut: ["stdout", "stderr"]
            }]
        };
        let output: string = 'Compile done!';
        let fileId: string = '';
        let code: number = 0;
        await axios.post<Result[]>('http://localhost:5050/run', judgeTask).then((response) => {
            if (response.data[0].files !== undefined && response.data[0].files["stderr"] !== "") {
                // code error

                output = response.data[0].files["stderr"];
                code = 1;
            } else fileId = response.data[0].fileIds!["Main.class"];
        }).catch((error) => {
            output = String('Bad request in compile: ' + error.message);
            code = 2;
        });

        return {code: code, message: output, fileId: fileId};
    }

    public static exec = async (input: string, execFileId: string): Promise<{code: number, output: string, runtime: number, memory: number}> => {

        const execTask: JudgeRequest = {
            cmd:[{
                args: ["/usr/bin/java", "Main"], // 使用 java 运行 Main 类
                env: ["PATH=/usr/bin:/bin"], // 输入数据
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
                    "Main.class": {
                        fileId: execFileId
                    }
                }
            }]
        };

        // running
        let output: string = '';
        let code: number = 0;
        let runtime: number = 0;
        let memory: number = 0;
        await axios.post<Result[]>('http://localhost:5050/run', execTask).then((response) => {
            if (response.data[0].error !== undefined) {
                // runtime error
                output = response.data[0].error;
                code = 1;
            } else if (response.data[0].files !== undefined && response.data[0].files["stderr"] !== "") {
                // runtime error
                output = response.data[0].files["stderr"];
                code = 1;
            } else if (response.data[0].fileError !== undefined) {
                // system error
                console.error("System error: ");
                response.data[0].fileError.forEach((error: FileError) => {
                    console.error(error.message);
                })
                code = 2;
            } else if (response.data[0].exitStatus === 0) {
                // run success
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

        return {code: code, output: output, runtime: runtime, memory: memory};
    }
}