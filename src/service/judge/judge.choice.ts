import {DispatchTask} from "../../types/client";
import {JudgeCpp} from "./language/judge.cpp";
import {Judge} from "./judge";
import {JudgeC} from "./language/judge.c";
import {JudgePython} from "./language/judge.python";

export class JudgeChoice {

    private  pythonTask:DispatchTask;

    public  chooseJudge = async (compileTask: DispatchTask): Promise<{
        code: number,
        message: string,
        fileId: string
    }> => {
        if (compileTask.language === "c") {
            return await JudgeC.judge(compileTask);
        } else if (compileTask.language === "cpp") {
            return await JudgeCpp.judge(compileTask);
        }else if (compileTask.language === "py"){
            // return await JudgePython.judge(compileTask);
            this.pythonTask = compileTask;
            return await JudgePython.judge();
        } else {
            return {code: 1, message: 'error type', fileId: ''};
        }
    }

    public  chooseExec = async (input: string, execFile: string, language: string): Promise<{
        code: number;
        output: string;
        runtime: number;
        memory: number
    }> => {
        if (language === "c") {
            return await JudgeC.exec(input, execFile);
        } else if (language === "cpp") {
            return await JudgeCpp.exec(input, execFile);
        } else if (language === "py"){
            return await JudgePython.exec(input,this.pythonTask);
        } else {
            return {code: 1, output: '', runtime: 0, memory: 0};
        }
    }
}