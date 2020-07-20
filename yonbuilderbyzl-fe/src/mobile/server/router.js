import Router from 'koa-router'
import '@mdf/cube/lib/helpers/prototype'
import { uniformProxy } from '@mdf/cube/lib/helpers/util'

const router = Router()
router.get('/meta/:menuId', function (ctx) {
  ctx.redirect('/');
})

// router.post('/uniform/getWeChatConfig', async function (ctx) {
//   // console.log(" ctx.req.url =" + ctx.req.url);
//   // let str = ctx.req.url;
//   // str = str.substr(str.indexOf("subUrl=") + 7);
//   let serviceUrl = 'http://upmall.yonyoucloud.com/client/pay/getWeChatConfig?corpid=4825';
//   // console.log("  serviceUrl = " + serviceUrl);
//   ctx.body = await req.pipe(request(serviceUrl))
//   return
// });
router.post('/uniform/getWeChatConfig', async function (ctx) {
  const { req, request } = ctx;
  // const requestUrl = 'http://upmalltest.yonyoucloud.com/client/pay/getWeChatConfig?corpid=4825';
  const requestUrl = 'http://client.umall.yonyouup.com/client/pay/getWeChatConfig?wid=gh_279a9e6db0b3&corpid=21';
  const config = {
    url: requestUrl,
    method: req.method,
    params: request.body
  };
  const json = await uniformProxy(config);
  let data = [];
  if (json.data ) {
    data = json.data;
  }
  ctx.body = { code: 200, data };
});
require('@mdf/plugin-meta/lib/router').default(router);

require('./controllers/user').default(router)

router.get('/home', function (ctx) {
  ctx.redirect('/home/index.html');
});

router.get('/download', function (ctx) {
  ctx.redirect('/home/download.html');
});

router.get('/', function (ctx) {
  ctx.render();
})
router.get('/login', function (ctx) {
  ctx.render();
})
router.get('/forgot', function (ctx) {
  ctx.redirect('/');
})
router.get('/menu', function (ctx) {
  ctx.redirect('/');
})
router.get('/menu/:menuId', function (ctx) {
  ctx.redirect('/');
})
router.get('/refer', function (ctx) {
  ctx.redirect('/');
})
router.get('/forget', function (ctx) {
  ctx.redirect('/');
})
router.get('/billing', function (ctx) {
  ctx.redirect('/');
})
router.get('/scanCode', function (ctx) {
  ctx.redirect('/');
})
router.get('/scan', function (ctx) {
  ctx.redirect('/');
})
router.get('/inputCode', function (ctx) {
  ctx.redirect('/');
})
router.get('/changePwd', function (ctx) {
  ctx.render();
})
router.get('/changePwd/:token', function (ctx) {
  ctx.render();
})
router.get('/version', function (ctx) {
  ctx.redirect('/');
})
router.get('/mdfInfo', function (ctx) {
  ctx.redirect('/');
})
router.get('/department', function (ctx) {
  ctx.redirect('/');
})
router.get('/reserve', function (ctx) {
  ctx.redirect('/');
})
router.get('/reserveInfo', function (ctx) {
  ctx.redirect('/');
})
router.get('/editreserve', function (ctx) {
  ctx.redirect('/');
})
router.get('/reverseDetail', function (ctx) {
  ctx.redirect('/');
})
router.get('/region', function (ctx) {
  ctx.redirect('/');
})
// todo: 开发暂用
router.get('/settleDetail', function (ctx) {
  ctx.redirect('/');
})
router.get('/setReceipts', function (ctx) {
  ctx.redirect('/');
})
router.get('/payContinue', function (ctx) {
  ctx.redirect('/');
})
router.get('/settleResult', function (ctx) {
  ctx.redirect('/');
})
export default router
