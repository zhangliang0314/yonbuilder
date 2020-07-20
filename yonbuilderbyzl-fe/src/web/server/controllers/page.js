import env from '../env';
import { getLoginUser } from './common';
import { uniformProxy, rebuildTreeData } from '@mdf/cube/lib/helpers/util';
import routesMap from '../../common/routes/config.route'
function renderPageContent (ctx, internals, title) {
  const pageInfo = {
    title: '核算服务'
  }
  if(title) {
    pageInfo.title = title;
  }
  try {
    ctx.render(pageInfo, internals)
  } catch (e) {
    ctx.logger.error(e)
  }
}

async function RenderPageAndData (ctx) {
  const user = await getLoginUser(ctx);
  if (!user) {
    ctx.redirect('/login');
    return;
  }
  const url = env.HTTP_USER_FETCH_TREE.format(ctx.token, 1);
  const config = {
    url,
    method: 'POST'
  };
  const json = await uniformProxy(config);
  if (json.code !== 200) {
    ctx.logger.error(`获取树结构失败：【接口】${url} 【异常】${json.message}`)
    ctx.body = json;
    return;
  }
  json.data = json.data || [];
  const orgMenus = []; const storeMenus = [];
  ctx.logger.error(ctx.entryPoint);
  rebuildTreeData(json.data, orgMenus, storeMenus);
  user.showOrg = !!orgMenus.length;
  user.showStore = !!storeMenus.length;
  const { device } = ctx.request.query;
  if (device)
    user.device = device;
  ctx.store.dispatch({
    type: 'PLATFORM_UI_USER_INIT',
    payload: user
  });
  ctx.store.dispatch({
    type: 'PLATFORM_UI_TREE_LOAD',
    TreeData: json.data
  });
  renderPageContent(ctx);
}
const pageController = {
    page: RenderPageAndData,
    portal: RenderPageAndData,
    menu: function (ctx) {
        renderPageContent(ctx,null,'业务菜单')
    },
    login: function (ctx) {
        renderPageContent(ctx)
    },
    register:function (ctx) {
        renderPageContent(ctx, false)
    },
    wechat:function (ctx) {
        renderPageContent(ctx);
    },
    forget: function (ctx) {
        renderPageContent(ctx, false)
    },
    expire: function (ctx) {
        renderPageContent(ctx)
    },
    extscripturls: async function (ctx) {
      var url = `${env.HTTP_CUSROMIZE_BUTTON_URL}${ctx.request.url}`;
      let response = await fetch(url,{
        method: 'GET',
        headers:  { 'Content-Type': 'application/javascript', 'Cookie':ctx.request.header.cookie},
        mode:'cors',
        credentials: "include"
      }).then(response => response.text())
        .then(data => data)

      ctx.body = response
    },
    healthcheck: async function (ctx) {
      var url = `${env.HTTP_SERVICE_BASEURL}/CloudRemoteCall/`;
      let response = await fetch(url,{
        method: 'GET',
        headers:  { 'Content-Type': 'application/html', 'Cookie':ctx.request.header.cookie},
        mode:'cors'
      }).then(response => response.text())
        .then(data => data)

      ctx.body = response
    }
}
// TODO 用户自定义路由
const customController = {};
Array.isArray(routesMap) && routesMap.length > 0 && routesMap.forEach(route => {
  const path = route.path;
  if(path) {
    let controllerKey = '';
    const pathArr = path.split('/');
    if(pathArr.length == 1) {
      controllerKey = pathArr[0]
    }else if(pathArr.length > 1) {
      controllerKey = pathArr[1]
    }
    customController[controllerKey] = function (ctx) {
      renderPageContent(ctx, null, route.title)
    }
  }
});
Object.assign(pageController, customController)

module.exports = pageController
