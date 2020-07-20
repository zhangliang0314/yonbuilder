import '@babel/polyfill'

import path from 'path';
import Koa from 'koa';
import serve from 'koa-static';
import impressRouter from 'impress-router';
import compress from 'koa-compress';
import bodyParser from 'koa-bodyparser';
import chalk from 'chalk';
import viewhook from './middlewares/viewhook';
import log4js from '@mdf/middlewares-log4js';
import auth from '@mdf/middlewares-auth';
import env from './env';
import '@mdf/cube/lib/helpers/polyfill';
import envMiddleware from './middlewares/env';
const isProduction = process.env.NODE_ENV === 'production'

const router = require('./router').default;
require('isomorphic-fetch');

const PREFIX = process.env.PREFIX || '/';
const iRouter = new impressRouter();

const app = new Koa();
app.use(envMiddleware)
app.use(log4js()) // 日志不能删除@mdf/metaui-web有调用
app.use(auth({config: env}))  //token校验
app.use(viewhook({ beautify: env.HTTP_HTML_BEAUTIFY })) // 处理模板
app.use(compress()) // gzip
app.use(bodyParser({ enableTypes: ['json'], jsonLimit: '10mb' })) // 上传
app.use(router.routes()) // 路由表
app.use(router.allowedMethods()) // 访问模式
app.use(iRouter)
iRouter.use(PREFIX, serve(path.join(process.cwd(), 'static', 'public'), { maxage: 365 * 24 * 60 * 60 * 1000 }));
iRouter.use(PREFIX, serve(path.join(process.cwd(), 'static'), isProduction ? { maxage: 365 * 24 * 60 * 60 * 1000 } : undefined));
// app.use(serve(path.join(process.cwd(), 'static', 'public'), { maxage: 365 * 24 * 60 * 60 * 1000 }))
// app.use(serve(path.join(process.cwd(), 'static'))) // , { maxage: 365 * 24 * 60 * 60 * 1000 }
app.listen(env.HTTP_SERVER_PORT) // 端口

console.log(chalk.blue(`MDF后端Node服务启动成功，端口：${env.HTTP_SERVER_PORT} 当前环境：${process.env.NODE_ENV}`))
