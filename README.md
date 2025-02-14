## README

### 项目简介

该项目旨在实现 GoJudge 和 OJ 平台之间的接口对接，提供数据交互和功能集成的解决方案。通过该项目，用户可以在两个平台之间无缝传输数据，实现更高效的在线评测和判题功能。

### 目录结构
```
├── src
│   ├── index.ts                    # 项目入口文件
│   ├── config                      # 配置文件目录
│   ├── types                       # 类型定义目录
│   ├── service                     # 相关服务目录
│   │   ├── response.ts             # 服务器向客户端发送消息的句柄类
│   │   ├── judge                   # 评测服务相关目录
│   │   │   ├── judge.ts            # 评测机类
│   │   │   ├── judge.factory.ts    # 评测机工厂类，选择语言对应的工具类
│   │   │   ├── judge.manage.ts     # 评测机管理类，管理评测机的状态和行为
│   │   │   ├── language            # 语言工具类目录
│   │   │   │   ├── judge.xx.ts     # 语言工具类
├── ...
└── README.md
```

### 安装依赖

使用以下命令安装项目所需的依赖：
```bash
npm install
```

### 构建项目

使用以下命令构建项目：
```bash
npm run build
```

### 运行项目
构建完成后，可以使用以下命令运行项目：
```bash
node dist/index.js
```

也可以直接使用以下命令运行项目：
```bash
npm run dev
```

### 项目配置

项目需要`GoJudge`在后台的`Linux`环境下运行，在Windows平台下可以使用`Docker`运行：

```bash
docker run -it --rm --privileged --shm-size=256m -p 5050:5050 --name=go-judge criyle/go-judge
```

该命令创建一个名为`go-judge`的一次性容器，监听`5050`端口，可以通过[http://localhost:5050](http://localhost:5050)访问`GoJudge`的前端页面。在停止容器后，容器会自动删除。

### 快速部署

项目增加了基于`Docker`的快速部署功能，可以不下载GoJudge即可在本地部署，方便代码调试。

项目根目录的`Dockerfile.local`文件为本地镜像构建文件，可以用该文件在本地构建镜像使用，构建镜像的命令如下：

```bash
docker build -t judge-local -f Dockerfile.local .
```

创建并运行容器的命令如下，如果只需要运行容器，则无需构建镜像，可以直接从Docker Hub中拉取([`lengtouzai/judge-local`](https://hub.docker.com/repository/docker/lengtouzai/judge-local)，当前最新版本为[`v1.0.1`](https://hub.docker.com/repository/docker/lengtouzai/judge-local/tags/1.0.1/sha256-c63fc5ba8b7c2bf1a8d88a5a12b437fb5f937b9cb66cf42f15d57de6156fbebf)）：

```bash
docker run --rm -it --privileged -v dist:/opt/dist -v package.json:/opt/package.json --name judge-local -p 8000:8000 lengtouzai/judge-local:1.0.1
```

该命令创建的容器在停止后会被删除。`-it`参数允许容器运行一个交互式的终端会话，用户可以在自己的终端中运行容器内部的交互式`bash`终端。调试结束后，执行`Ctrl + C`退出会话，容器自动被删除。

容器可以配置两个数据卷：

- `/opt/dist`：项目构建后的目录，需要从外部映射。上述指令中将本地构建的`dist`目录映射到容器内部，从而运行调试构建后的代码。
- `/opt/package.json`：项目需要的依赖，需要从外部映射。建议直接映射项目根目录的`package.json`文件。如果文件或依赖缺失，会导致容器内部项目运行报错。

容器还可以配置一个环境变量：

- `RUNNING_LEVEL`：项目的日志等级，对应了`.env.example`文件中的`RUNNING_LEVEL`，可以设置为：`silent`、`debug`、`info`、`warn`。默认值为`info`。

容器内部有两个服务端口：

- 8000端口为JudgeTS服务运行的端口，该端口映射直接用于连接HITWHOJ。
- 5050端口为GoJudge服务运行的端口，该端口映射后可以用于直接调试GoJudge服务或查看GoJudge评测机状态。