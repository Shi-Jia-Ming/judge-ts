// judge service for c++ language

import {DispatchTask} from "../../../types/client";
import {FileError, JudgeRequest, Result} from "../../../types/server";
import axios from "axios";

export class JudgeCpp {
  public static judge = async (task: DispatchTask): Promise<{ code: number; message: string, fileId: string }> => {
    const judgeTask: JudgeRequest = {
      cmd: [{
        args: ["/usr/bin/g++", "a.cpp", "-o", "a"],
        env: ["PATH=/usr/bin:/bin"],
        files: [{
          content: ""
        }, {
          name: "stdout",
          max: 10240
        }, {
          name: "stderr",
          max: 10240
        }],
        cpuLimit: 10000000000,
        memoryLimit: 104857600,
        procLimit: 50,
        copyIn: {
          "a.cpp": {
            content: task.code
          }
        },
        copyOutCached: ["a"],
        copyOut: ["stdout", "stderr"]
      }]
    };

    // compile and build
    let output: string = 'Compile done!';
    let fileId: string = '';
    let code: number = 0;
    await axios.post<Result[]>('http://localhost:5050/run', judgeTask).then((response) => {
      if (response.data[0].files !== undefined && response.data[0].files["stderr"] !== "") {
        // code error
        output = response.data[0].files["stderr"];
        code = 1;
      } else fileId = response.data[0].fileIds!["a"];
    }).catch((error) => {
      if (process.env.RUNNING_LEVEL === "debug") {
        console.error("[judge c++]", "bad request in compile:", error.message);
      }
      output = "";
      code = 2;
    });

    return {code: code, message: output, fileId: fileId};
  }

  public static exec = async (input: string, execFileId: string): Promise<{
    code: number,
    output: string,
    runtime: number,
    memory: number
  }> => {

    const execTask: JudgeRequest = {
      cmd: [{
        // TODO a文件名要保持唯一
        args: ["a"],
        env: ["PATH=/usr/bin:/bin"],
        files: [{
          content: input
        }, {
          name: "stdout",
          max: 10240
        }, {
          name: "stderr",
          max: 10240
        }],
        cpuLimit: 10000000000,
        memoryLimit: 104857600,
        procLimit: 50,
        copyIn: {
          "a": {
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
      if (process.env.RUNNING_LEVEL === "debug") {
        console.error("[judge c++]", "bad request in execute:", error.message);
      }
      output = "";
      code = 2;
    });

    return {code: code, output: output, runtime: runtime, memory: memory};
  }
}
