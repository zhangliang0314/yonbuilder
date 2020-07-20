import React from 'react'
import ReactDOMServer from 'react-dom/server'
import beautify from 'js-beautify'
import querystring from 'querystring'
import html from './html'
import Isomorph from 'src/common/redux/Isomorph'
import routes from 'src/common/routes'
import customRoutesMap from '../../../common/routes/config.route'
const routesMap = {
  index: routes
};

let rebuildPaths = ['/', '/portal', '/register', '/wechat', '/forget', '/menu'];
// TODO 用户自定义
const customPaths = [];
Array.isArray(customRoutesMap) && customRoutesMap.length > 0 && customRoutesMap.forEach(route => {
  const path = route.path;
  if(path) {
    customPaths.push(path);
  }
});
rebuildPaths = Array.from(new Set(rebuildPaths.concat(...customPaths)));

const directNext = function (ctx) {
  if (rebuildPaths.indexOf(ctx.path) > -1 ||
    ctx.path.startsWith('/login') ||
    ctx.path.startsWith('/billing') ||
    (process.env.PREFIX && ctx.path.startsWith(process.env.PREFIX)) ||
    ctx.path.startsWith('/meta') ||
    ctx.path.startsWith('/platform') ||
    ctx.path.startsWith('/echartcarousel'))
    return false;
  return true;
}

export default function viewhook (_options = { beautify: true, internals: true }) {
  const options = Object.assign({}, _options)

  return async function (ctx, next) {
    const __THEMETYPE__ = ctx.cookies.get('themeType');
    // TODO 请求中有/json /json/version
    if(ctx.path.includes('/json')) return;

    if (directNext(ctx)) {
      await next();
      return;
    }
    const isTouch = ctx.header['user-agent'].match(/(Android);?[\s/]+([\d.]+)?/) || ctx.path === '/billing/touch' || ctx.path === '/login/touch';
    if (isTouch)
      ctx.entryPoint = 'touch';
    else if (ctx.path === '/billing')
      ctx.entryPoint = 'billing';
    else
      ctx.entryPoint = __THEMETYPE__ == undefined || process.env.NODE_ENV !== 'production' ? 'index' : `${__THEMETYPE__.toLocaleLowerCase()}.index`;
    ctx.store = Isomorph.createStore(ctx.entryPoint)
    ctx.history = Isomorph.createHistory(ctx.store, ctx.path)
    ctx.render = function (pageInfo, internals = options.internals || true) {
      const render = internals
        ? ReactDOMServer.renderToString
        : ReactDOMServer.renderToStaticMarkup

      let markup
      try {
        markup = render(<Isomorph store={ctx.store} history={ctx.history}
          routes={routesMap[ctx.entryPoint]}
        />)

        if (options.beautify) {
          markup = beautify.html(markup)
        }
      } catch (error) {
        markup = ''
      }

      let queryStr = ''
      let previewTitle = ''
      const urlSplittedArr = ctx.url.split('?') || []
      if (urlSplittedArr.length === 2) { // 有query
        queryStr = urlSplittedArr.pop()
        const query = querystring.parse(queryStr)
        const previewStr = query._preview
        if (previewStr) {
          previewTitle = `${previewStr.includes('预览') ? previewStr : `预览 - ${previewStr}`}`
        }
      }
      if (previewTitle) {
        pageInfo.title = previewTitle
      }

      ctx.type = 'html';
      // 判断页面是否为billing, 传入html加载不同的依赖
      ctx.store.getState().__GLOBALZITION__ = ctx.globalizationInfo
      ctx.body = html(Object.assign({ entryPoint: ctx.entryPoint }, pageInfo), markup, ctx.store.getState())
    }

    await next()
  }
}
