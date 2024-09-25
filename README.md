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