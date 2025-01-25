import {DispatchTask} from "../../../types/client";

export default interface JudgeInterface {
  judge(task: DispatchTask): Promise<{ code: number; message: string; fileId: string }>;

  exec(input: string, execFileId: string): Promise<{ code: number; output: string, runtime: number, memory: number }>;

  delete(execFile: string): Promise<void>;
}