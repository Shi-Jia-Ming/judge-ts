import {AssignMessage, DispatchTask} from "../../types/client";
import {JudgeCpp} from "./language/judge.cpp";
import {JudgeC} from "./language/judge.c";
import {JudgePython} from "./language/judge.python";
import {JudgeJava} from "./language/judge.java";

export class JudgeFactory {
  public static chooseJudge = async (compileTask: DispatchTask): Promise<{
    code: number,
    message: string,
    fileId: string
  }> => {
    if (compileTask.language === "c") {
      return await JudgeC.judge(compileTask);
    } else if (compileTask.language === "cpp") {
      return await JudgeCpp.judge(compileTask);
    } else {
      return {code: 1, message: 'error type', fileId: ''};
    }
  }

  public static chooseExec = async (input: string, execFile: string, task: AssignMessage): Promise<{
    code: number;
    output: string;
    runtime: number;
    memory: number
  }> => {
    if (task.language === "c") {
      return await JudgeC.exec(input, execFile);
    } else if (task.language === "cpp") {
      return await JudgeCpp.exec(input, execFile);
    } else if (task.language === "py") {
      return await JudgePython.exec(input, task);
    } else if (task.language === "java"){
      return await JudgeJava.exec(input,execFile);
    }else {
      return {code: 1, output: '', runtime: 0, memory: 0};
    }
  }

}