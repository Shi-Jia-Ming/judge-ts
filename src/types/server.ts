export interface LocalFile {
    src: string;    // 文件绝对路径
}

export interface MemoryFile {
    content: string | Buffer;   // 文件内容
}

export interface PreparedFile {
    fileId: string; // 文件 id
}

export interface Collector {
    name: string; // copyOut 文件名
    max: number;  // 最大大小限制
    pipe?: boolean; // 通过管道收集（默认值为false文件收集）
}

export interface Symlink {
    symlink: string; // 符号连接目标 (v1.6.0+)
}

export interface StreamIn {
    streamIn: boolean; // 流式输入 (v1.8.1+)
}

export interface StreamOut {
    streamOut: boolean; // 流式输出 (v1.8.1+)
}

export interface Cmd {
    args: string[];     // 程序命令行参数
    env?: string[];     // 程序环境变量

    // 指定标准输入、标准输出和标准错误的文件
    files?: (LocalFile | MemoryFile | PreparedFile | Collector | StreamIn | StreamOut | null)[];
    tty?: boolean;      // 开启 TTY

    // 资源限制
    cpuLimit?: number;     // CPU时间限制，单位纳秒
    clockLimit?: number;   // 等待时间限制，单位纳秒 （通常为 cpuLimit 两倍）
    memoryLimit?: number;  // 内存限制，单位 byte
    stackLimit?: number;   // 栈内存限制，单位 byte
    procLimit?: number;    // 线程数量限制
    cpuRateLimit?: number; // 仅 Linux，CPU 使用率限制，1000 等于单核 100%
    cpuSetLimit?: string;  // 仅 Linux，限制 CPU 使用，使用方式和 cpuset cgroup 相同 （例如，`0` 表示限制仅使用第一个核）
    strictMemoryLimit?: boolean; // deprecated: 使用 dataSegmentLimit （这个选项依然有效）
    dataSegmentLimit?: boolean; // 仅linux，开启 rlimit 堆空间限制（如果不使用cgroup默认开启）
    addressSpaceLimit?: boolean; // 仅linux，开启 rlimit 虚拟内存空间限制（非常严格，在所以申请时触发限制）

    // 在执行程序之前复制进容器的文件列表
    copyIn?: {[dst:string]: LocalFile | MemoryFile | PreparedFile | Symlink};

    // 在执行程序后从容器文件系统中复制出来的文件列表
    // 在文件名之后加入 '?' 来使文件变为可选，可选文件不存在的情况不会触发 FileError
    copyOut?: string[];
    // 和 copyOut 相同，不过文件不返回内容，而是返回一个对应文件 ID ，内容可以通过 /file/:fileId 接口下载
    copyOutCached?: string[];
    // 指定 copyOut 复制文件大小限制，单位 byte
    copyOutMax?: number;
}

export interface JudgeRequest {
    cmd: Cmd[];
}

export enum Status {
    Accepted = 'Accepted', // 正常情况
    MemoryLimitExceeded = 'Memory Limit Exceeded', // 内存超限
    TimeLimitExceeded = 'Time Limit Exceeded', // 时间超限
    OutputLimitExceeded = 'Output Limit Exceeded', // 输出超限
    FileError = 'File Error', // 文件错误
    NonzeroExitStatus = 'Nonzero Exit Status', // 非 0 退出值
    Signalled = 'Signalled', // 进程被信号终止
    InternalError = 'Internal Error', // 内部错误
}

enum FileErrorType {
    CopyInOpenFile = 'CopyInOpenFile',
    CopyInCreateFile = 'CopyInCreateFile',
    CopyInCopyContent = 'CopyInCopyContent',
    CopyOutOpen = 'CopyOutOpen',
    CopyOutNotRegularFile = 'CopyOutNotRegularFile',
    CopyOutSizeExceeded = 'CopyOutSizeExceeded',
    CopyOutCreateFile = 'CopyOutCreateFile',
    CopyOutCopyContent = 'CopyOutCopyContent',
    CollectSizeExceeded = 'CollectSizeExceeded',
}

export interface FileError {
    name: string; // 错误文件名称
    type: FileErrorType; // 错误代码
    message?: string; // 错误信息
}

export interface Result {
    status: Status;
    error?: string; // 详细错误信息
    exitStatus: number; // 程序返回值
    time: number;   // 程序运行 CPU 时间，单位纳秒
    memory: number; // 程序运行内存，单位 byte
    runTime: number; // 程序运行现实时间，单位纳秒
    // copyOut 和 pipeCollector 指定的文件内容
    files?: {[name:string]:string};
    // copyFileCached 指定的文件 id
    fileIds?: {[name:string]:string};
    // 文件错误详细信息
    fileError?: FileError[];
}