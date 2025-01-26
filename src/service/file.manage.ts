import { SyncResponseMessage } from "../types/client";
import Logger from "../utils/logger";
import { JudgeManager } from "./judge/judge.manage";
import { Judge2WebManager } from "./response";

type Waiting = {
  uuid: string;
  instanceId: number;
}

export default class FileManager {
  private fileList: Array<Waiting> = [];

  private response: Judge2WebManager;

  private readonly logger = new Logger("file manager");

  constructor(response: Judge2WebManager) {
    this.response = response;
  }

  public requestFile = (uuid: string, instanceId: number) => {
    this.logger.info("request file", uuid, "for instance", instanceId);
    this.response.fileSync(uuid);
    this.fileList.push({ uuid, instanceId });
  }

  public receiveFile = (file: SyncResponseMessage, judgeManager: JudgeManager) => {
    const waiting = this.fileList.find((waiting) => waiting.uuid === file.uuid);
    if (waiting) {
      judgeManager.saveFile(file, waiting.instanceId);
      this.logger.info("received file", file.uuid, "for instance", waiting.instanceId);
      this.fileList.splice(this.fileList.indexOf(waiting), 1);
    } else {
      this.logger.error("no judge instance is waiting for this file");
    }
  }
}