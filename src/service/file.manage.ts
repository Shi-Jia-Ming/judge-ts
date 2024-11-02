import { SyncResponseMessage } from "../types/client";
import { JudgeManager } from "./judge/judge.manage";
import { Judge2WebManager } from "./response";

type Waiting = {
    uuid: string;
    instanceId: number;
}

export default class FileManager {
    private fileList: Array<Waiting> = [];

    private response: Judge2WebManager;

    constructor(response: Judge2WebManager) {
        this.response = response;
    }

    public requestFile = (uuid: string, instanceId: number) => {
        this.response.fileSync(uuid);
        this.fileList.push({ uuid, instanceId });
    }

    public receiveFile = (file: SyncResponseMessage, judgeManager: JudgeManager) => {
        const waiting = this.fileList.find((waiting) => waiting.uuid === file.uuid);
        if (waiting) {
            judgeManager.saveFile(file, waiting.instanceId);
            this.fileList = this.fileList.filter((waiting) => waiting.uuid !== file.uuid);
        } else {
            // TODO error
            if (process.env.RUNNING_LEVEL === "debug") {
                console.error("[file manager]", "no judge instance is waiting for this file");
            }
        }
    }
}