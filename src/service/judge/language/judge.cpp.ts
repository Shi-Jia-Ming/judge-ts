// judge service for c++ language

import {DispatchTask} from "../../../types/client";
import {JudgeRequest, Result} from "../../../types/server";
import axios, {AxiosResponse} from "axios";

export class JudgeCpp {
    public static judge = async (task: DispatchTask): Promise<{code: number; message: string}> => {
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
        let code: number = 0;
        await axios.post<Result[]>('http://localhost:5050/run', judgeTask).then((response) => {
            if (response.data[0].files !== undefined && response.data[0].files["stderr"] !== "") {
                // code error
                output = response.data[0].files["stderr"];
                code = 1;
            }
        }).catch((error) => {
            output = String('Bad request: ' + error.message);
            code = 2;
        });

        return {code: code, message: output};
    }
}
