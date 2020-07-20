
# MDF 2.0

## 1. 使用文档

1. 文档地址：http://tinper.org/mdf


## 2. 安装

1. 需要安装`ynpm`工具使用内网镜像源进行安装私有包`@mdf/xxx`

```bash
$ npm install ynpm-tool -g
```
2. 内网执行`ynpm install`安装即可

## 3. 扩展组件
1. 相关扩展组件在`src/web/common/extends`中扩展，修改对应的配置文件`config.comp`和`registerMetaComp`

## 4. 环境配置
1. `src/web/common/config.env.js` 修改启动接口地址，可以启动不同脚本来选择环境详见下方环境部署

## 5. 框架的维护
1. yxyweb框架按照功能拆分成不同的包来维护；
2. 如果遇到功能修改，需要修改对应的依赖包；

## 7. 调试、部署

**用户可根据部署环境不同，自由扩展；需要在`src/web/common/config.env.js`中配置对应的服务地址**

MDF2.0启动两个服务、前端和后端node.js部分，命令整合之后可以启动一套命令

web端启动：

```bash
# 1. 启动默认调试，会开启前后端服务，默认接口为src/web/common/config.env.js中的default
npm run debug:web

# 2. 启动其他接口调试，也就是通过环境变量区分不同的环境
npm run debug:web:ncc

# 3. 单独启动前端工程
npm run debug:client

# 4. 单独启动后端node.js服务
npm run debug:server
```

mobile端启动：

```bash
# 1. 启动移动端前端和后端node服务
npm run debug:mobile

# 2. 单独启动移动前端
npm run debug:mobile:client

# 3. 单独启动后端node服务
npm run debug:mobile:server

```

部署上线服务：

```bash
# 1. 构建DLL资源包
npm run build:dll

# 2. 构建web端部署
npm run build:web

# 3. 启动服务
npm run start:web
npm run start:mobile

# 4. 构建mobile部署
npm run build:mobile
```

内置扩展脚本
 ```bash
 内置扩展脚本为移动端零售单
 ```
