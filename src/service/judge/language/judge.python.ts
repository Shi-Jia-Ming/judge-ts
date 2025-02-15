import {DispatchTask} from "../../../types/client";
import {FileError, JudgeRequest, Result} from "../../../types/server";
import axios from "axios";
import JudgeInterface from "./judge.interface";
import Logger from "../../../utils/logger";

export class JudgePython implements JudgeInterface {
  private code: string = "";

  private readonly logger: Logger = new Logger("judge python");

  // 准备并运行 Python 代码
  public judge = async (task: DispatchTask): Promise<{ code: number, message: string, fileId: string }> => {
    this.code = task.code;
    return {code: 0, message: "Python Running!", fileId: "Python"};
  };

  // 运行 Python 代码
  public exec = async (input: string, _execFileId: string): Promise<{
    code: number,
    output: string,
    runtime: number,
    memory: number
  }> => {
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
            content: this.code
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
        this.logger.error("system error: ");
        response.data[0].fileError.forEach((error: FileError) => {
          this.logger.error(error.message);
        });
        code = 2;
      } else if (response.data[0].exitStatus === 0) {
        // 运行成功
        output = response.data[0].files!["stdout"];
        runtime = response.data[0].time;
        memory = response.data[0].memory;
      } else {
        this.logger.error("unknown error!");
        code = 2;
      }
    }).catch((error) => {
      this.logger.error("bad request in execute:", error.message);
      output = "";
      code = 2;
    });

    return {code: code, output: output, runtime: Math.round(runtime / 1000), memory: Math.round(memory / 1024)};
  };

  public delete = async (execFile: string): Promise<void> => {
    const _ = await axios.delete(`http://localhost:5050/file/${execFile}`);
  };
}