import path from 'path'
import Koa from 'koa'
import serve from 'koa-static'
import logger from 'koa-logger'
import compress from 'koa-compress'
import bodyParser from 'koa-bodyparser'
import chalk from 'chalk'

import viewhook from './middlewares/viewhook/mobile'
import auth from '@mdf/middlewares-auth/'
import log4js from '@mdf/middlewares-log4js';
import env from './env'
import '@mdf/cube/lib/helpers/polyfill'

require('isomorphic-fetch')

const router = require('./router').default;

new Koa()
  .use(log4js())
  .use(auth({ config: env }))
  .use(viewhook())
  .use(logger())
  .use(compress())
  .use(bodyParser({ enableTypes: ['json'], jsonLimit: '10mb' }))
  .use(router.routes())
  .use(router.allowedMethods())
  .use(serve(path.join(process.cwd(), 'static', 'public'), { maxage: 365 * 24 * 60 * 60 * 1000 }))
  .use(serve(path.join(process.cwd(), 'home')))
  .use(serve(path.join(process.cwd(), 'static'))) // , { maxage: 365 * 24 * 60 * 60 * 1000 }
  .listen(env.HTTP_SERVER_PORT)

console.log(chalk.blue(`listening on port ${env.HTTP_SERVER_PORT} -- ${process.env.NODE_ENV}`))
