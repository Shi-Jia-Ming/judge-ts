import {AssignMessage, DispatchTask} from "../../types/client";
import {JudgeCpp} from "./language/judge.cpp";
import {JudgeC} from "./language/judge.c";
import {JudgePython} from "./language/judge.python";
import {JudgeJava} from "./language/judge.java";
import axios from "axios";
import JudgeInterface from "./language/judge.interface";

export class JudgeFactory {
  public static build = (language: string): JudgeInterface => {
    if (language === "c") {
      return new JudgeC();
    } else if (language === "cpp") {
      return new JudgeCpp();
    } else if (language === "py") {
      return new JudgePython();
    } else if (language === "java") {
      return new JudgeJava();
    } else {
      return new JudgeC();
    }
  }


  // public static judge = async (compileTask: DispatchTask): Promise<{
  //   code: number,
  //   message: string,
  //   fileId: string
  // }> => {
  //   if (compileTask.language === "c") {
  //     return await JudgeC.judge(compileTask);
  //   } else if (compileTask.language === "cpp") {
  //     return await JudgeCpp.judge(compileTask);
  //   } else {
  //     return {code: 1, message: 'error type', fileId: ''};
  //   }
  // }

  // public static exec = async (input: string, execFile: string, task: AssignMessage): Promise<{
  //   code: number;
  //   output: string;
  //   runtime: number;
  //   memory: number
  // }> => {
  //   if (task.language === "c") {
  //     return await JudgeC.exec(input, execFile);
  //   } else if (task.language === "cpp") {
  //     return await JudgeCpp.exec(input, execFile);
  //   } else if (task.language === "py") {
  //     return await JudgePython.exec(input, task);
  //   } else if (task.language === "java"){
  //     return await JudgeJava.exec(input,execFile);
  //   }else {
  //     return {code: 1, output: '', runtime: 0, memory: 0};
  //   }
  // }

  // TODO 直接在这里实现是不是不太好
  static async deleteFile(execFile: string) {
    const _ = await axios.delete(`http://localhost:5050/file/${execFile}`);
  }
}