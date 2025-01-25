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

  // TODO 直接在这里实现是不是不太好
  static async deleteFile(execFile: string) {
    const _ = await axios.delete(`http://localhost:5050/file/${execFile}`);
  }
}