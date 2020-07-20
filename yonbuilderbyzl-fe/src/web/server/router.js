import Router from 'koa-router'
//import sourcemapController from './controllers/sourceMap';
import ueditorController from './controllers/ueditor';
import pageController from './controllers/page';

import fetchController from './controllers/fetch';
// import { getLoginUser } from './controllers/common';
import routesMap from '../common/routes/config.route'
const router = Router()
// process.env.PREFIX && router.prefix(process.env.PREFIX);
const version = require('uuid')()
// sourceMap
//router.get('/sourcemap/:name/:pwd', sourcemapController.sourcemapByNamePwd);
//router.get('/scripts/*.min.js.map', sourcemapController.scripts);

// ueditor
router.get('/basictest', ueditorController.basictest);
router.all('/ueditor/ue', ueditorController.ue);
// page
router.get('/login', pageController.login);
router.get('/menu', pageController.menu);
router.get('/register', pageController.register);
router.get('/wechat', pageController.wechat);
router.get('/forget', pageController.forget);
router.get('/expire', pageController.expire);
router.get('/page/**', pageController.page);
router.get('/portal', pageController.portal);
//添加代理扩展脚本文件
router.get('/hpapaas-passport-be/hpaextcoderegister/getHpaExtCodeRegister', pageController.extscripturls);
router.get('/demo/health', pageController.healthcheck);

// // 自定义controller
// router.get('/platform/:menuurl', async function (ctx) {
//   ctx.render({ title: ctx.params.menuurl });
// });
// router.get('/meta/:billtype/:billno', async function (ctx) {
//   ctx.render({
//     title: ctx.params.billno
//   });
// })
// TODO 用户配置的页面
Array.isArray(routesMap) && routesMap.length > 0 && routesMap.map(route => {
  const path = route.path;
  if(path) {
    let controllerKey = '';
    const pathArr = path.split('/');
    if(pathArr.length == 1) {
      controllerKey = pathArr[0]
    }else if(pathArr.length > 1) {
      controllerKey = pathArr[1]
    }
    return router.get(path, pageController[controllerKey]);
  }else {
    return null;
  }
})

// 测试fetch是否可用
router.get('/test/fetch', fetchController.fetch);

// 跳到门户页面
router.get('/', async function (ctx) {
  const redirectUrl = (ctx.host.indexOf('yonyoucloud') === -1 && ctx.host.indexOf('yonyouup') === -1) ? '/menu' : '/index.html';
  ctx.redirect(ctx.entryPoint === 'touch' ? '/billing' : redirectUrl);
});

// const metaByBillNo = async function(ctx) {
//   // if (ctx.entryPoint === 'touch') {
//   //   ctx.redirect('/billing');
//   //   return;
//   // }
//   if (ctx.store) {
//     const user = await getLoginUser(ctx);
//     if (!user) {
//       ctx.redirect('/login');
//       return;
//     }
//     ctx.store.dispatch({
//       type: 'PLATFORM_UI_USER_INIT',
//       payload: user
//     });
//   }
//   ctx.render({
//     title: ctx.params.billno
//   });
// }
// 兼容YS和NCC的用户信息获取 yueming
// if (require('../../../package.json').themeType == "ys") {
//   router.get('/meta/:billtype/:billno',metaByBillNo);
//   router.get('/meta/:billtype/:billno/:billid', metaByBillNo);
// }

// 第三方插件支持
router.get('/third-support-universal/:supportName', function (ctx) {
  let host = ctx.host; 
  ctx.body = `(function () {
    let _origin = "http://"+"${host}"+"${process.env.PREFIX}";
    let _http=null;
    let _thirdsupport = document.getElementById("yxy-third-support");
    if(_thirdsupport){
      let _src = _thirdsupport ?_thirdsupport.getAttribute('src'):null;
      _origin = _src.includes('https') ? "https://" +"${host}${process.env.PREFIX}":_origin
    }
    var script = document.createElement("script");
    var link = document.createElement("link");
    script.src = _origin+"/javascripts/yxyweb-support-${ctx.params.supportName}.min.js?_=${version}";
    script.setAttribute("async", true);
    link.href = _origin+"/styles/default/yxyweb-support-${ctx.params.supportName}.min.css?_=${version}";
    link.rel="stylesheet"
    link.type="text/css"
    let head = document.getElementsByTagName('head')[0];
    head.appendChild(script);
    head.appendChild(link);
    window.thirdsupportorigin = _origin;
  })()`
})

require('@mdf/plugin-meta/lib/router').default(router);

export default router
