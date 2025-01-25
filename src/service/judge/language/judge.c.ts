// judge language for c language

import { DispatchTask } from "../../../types/client";
import { FileError, JudgeRequest, Result } from "../../../types/server";
import axios from "axios";
import JudgeInterface from "./judge.interface";
import { v4 as uuidv4 } from 'uuid';
import Logger from "../../../utils/logger";

export class JudgeC implements JudgeInterface {
  fileName: string = "";

  private readonly logger: Logger = new Logger("judge c");

  public constructor() {
    this.fileName = uuidv4();
  }

  // 编译C语言
  public judge = async (
    task: DispatchTask,
  ): Promise<{ code: number; message: string; fileId: string }> => {
    // 默认开启O2优化
    if (1) task.code = "#pragma GCC optimize(2)\n" + task.code;

    const judgeTask: JudgeRequest = {
      cmd: [
        {
          args: ["/usr/bin/gcc", "a.c", "-o", "a"], // 使用gcc
          env: ["PATH=/usr/bin:/bin"], // 设置环境变量
          files: [
            {
              content: "", // 兼容性保留
            },
            {
              name: "stdout",
              max: 998244353998244353,
            },
            {
              name: "stderr",
              max: 998244353998244353,
            },
          ],
          cpuLimit: 10000000000, // CPU时间限制为10秒
          memoryLimit: 2 * 1024 * 1024 * 1024, // 内存限制为100MB
          procLimit: 50, // 限制50进程
          copyIn: {
            "a.c": {
              content: task.code, // 用户代码写入a.c
            },
          },
          copyOutCached: ["a"],
          copyOut: ["stdout", "stderr"],
        },
      ],
    };

    let output: string = "Compile done!";
    let fileId: string = "";
    let code: number = 0;
    await axios
      .post<Result[]>("http://localhost:5050/run", judgeTask)
      .then((response) => {
        if (
          response.data[0].files !== undefined &&
          response.data[0].files["stderr"] !== ""
        ) {
          output = response.data[0].files["stderr"];
          code = 1;
        } else {
          fileId = response.data[0].fileIds!["a"];
        }
      })
      .catch((error) => {
        this.logger.error("bad request in compile:", error.message);

        output = "";
        code = 2;
      });

    return { code: code, message: output, fileId: fileId };
  };

  // 运行C语言
  public exec = async (
    input: string,
    execFileId: string,
  ): Promise<{
    code: number;
    output: string;
    runtime: number;
    memory: number;
  }> => {
    const execTask: JudgeRequest = {
      cmd: [
        {
          // TODO a文件名要保持唯一
          args: ["a"],
          env: ["PATH=/usr/bin:/bin"],
          files: [
            {
              content: input,
            },
            {
              name: "stdout",
              max: 998244353998244353,
            },
            {
              name: "stderr",
              max: 998244353998244353,
            },
          ],
          cpuLimit: 10000000000,
          memoryLimit: 2 * 1024 * 1024 * 1024,
          procLimit: 50,
          copyIn: {
            a: {
              fileId: execFileId,
            },
          },
        },
      ],
    };

    let output: string = "";
    let code: number = 0;
    let runtime: number = 0;
    let memory: number = 0;
    await axios
      .post<Result[]>("http://localhost:5050/run", execTask)
      .then((response) => {
        if (response.data[0].error !== undefined) {
          // runtime error
          output = response.data[0].error;
          code = 1;
        } else if (
          response.data[0].files !== undefined &&
          response.data[0].files["stderr"] !== ""
        ) {
          // runtime error
          output = response.data[0].files["stderr"];
          code = 1;
        } else if (response.data[0].fileError !== undefined) {
          // system error
          this.logger.error("system error: ");
          response.data[0].fileError.forEach((error: FileError) => {
            this.logger.error(error.message);
          });

          code = 2;
        } else if (response.data[0].exitStatus === 0) {
          // run success
          output = response.data[0].files!["stdout"];
          runtime = response.data[0].time;
          memory = response.data[0].memory;
        } else {
          this.logger.error("unknown error!");
          code = 2;
        }
      })
      .catch((error) => {
        this.logger.error("bad request in execute:", error.message);
        output = "";
        code = 2;
      });

    return {
      code: code,
      output: output,
      runtime: Math.round(runtime / 1000 / 1000),
      memory: Math.round(memory / 1024),
    };
  };
}
