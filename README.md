## README

### 项目简介

该项目旨在实现 GoJudge 和 OJ 平台之间的接口对接，提供数据交互和功能集成的解决方案。通过该项目，用户可以在两个平台之间无缝传输数据，实现更高效的在线评测和判题功能。

### 目录结构
```
├── deploy                          # 快速部署目录
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

项目增加了基于`Docker`的快速部署功能，可以不下载GoJudge即可在本地部署，方便代码调试。相关的文件在`deploy`目录中。相关文件的解释如下：

```txt
├── .env.deploy         # 生产环境下的 .env 文件
├── package.json        # 项目的依赖配置文件
├── Dockerfile.local    # Dockerfile 文件
```

其中，`Dockerfile.local`文件不需要更改，剩下两个文件可以根据调试的需要更改。`package.json`文件用来指定项目需要的依赖项，一般情况下和原项目保持一致。如果更改该文件，需要重新运行容器。每次重新运行容器时都会重新安装依赖。如果依赖有变动在运行容器时会自动更改。`.env.deploy`文件的改动会同步到容器内部，更改后无需重新运行容器即可生效。

构建镜像的命令如下：

```bash
# 镜像构建的上下文目录为 deploy
docker build -t judge-local -f .\\deploy\\Dockerfile.local .\\deploy
```

创建并运行容器的命令如下，如果只需要运行容器，则无需构建镜像，可以直接从Docker Hub中拉取（`lengtouzai/judge-local`）：

```bash
docker run --rm -it --privileged -v .\\dist:/opt/dist -v .\\deploy\\.env.deploy:/opt/.env -v .\\deploy\\package.json:/opt/package.json --name judge-local -p 8000:8000 lengtouzai/judge-local
```

该命令创建的容器在停止后会被删除。`-it`参数允许容器运行一个交互式的终端会话，用户可以在自己的终端中运行容器内部的交互式`bash`终端。调试结束后，执行`Ctrl + C`退出会话，容器自动被删除。

容器可以配置三个数据卷，其中有一个必须配置，其他两个可以选择性配置。`/opt/dist`目录为项目构建后的目录，需要从外部映射。上述指令中将本地构建的`dist`目录映射到容器内部，从而运行调试构建后的代码。

`/opt/.env`和`/opt/package.json`两个文件也可以通过数据卷映射。文件映射后，通过修改外部文件可以直接更改容器内部的配置文件。重新运行容器即可载入配置。（不过使用`--rm`参数，每次运行时创建，不运行时删除在一些时候会更方便）。