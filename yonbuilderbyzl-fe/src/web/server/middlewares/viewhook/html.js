import invariant from 'invariant';
import env from '../../env'
import { envConfig as staticEnv } from '@mdf/cube/lib/extend'
const isDev = process.env.NODE_ENV === 'development';
const baseUrl = env.HTTP_SCRIPT_BASEURL;
const HTTP_PREFIX = env.HTTP_PREFIX
const suffix = env.HTTP_SCRIPT_SUFFIX;
const random = isDev ? '' : `?_=${env.STATIC_RANDOM_SUFFIX}`;
const printMeta = env.PRINT_META;
const serviceBaseUrl = env.HTTP_SERVICE_BASEURL;
const weburl = env.HTTP_WEB_URL;
// const cooperationBaseUrl = env.HTTP_COOPERATION_URL;
export default function html (pageInfo, content, state) {
  // 开发环境使用样式热更新, 不再用打包后的独立css文件
  const loadCss = isDev ? '' : `<link href="${baseUrl}/stylesheets/${pageInfo.entryPoint}${suffix}.css${random}" rel="stylesheet" type="text/css" />`
  // const yyyScript = isDev ? '' : `<script src="//yyy.yonyoucloud.com/js/yonyou-yyy.js?tid=&appid="></script>`;
  // const upcScript = weburl ? `<script src="${weburl}${process.env.PREFIX}/third-support/withReact" id="yxy-third-support"></script>` : ''
  invariant(
    typeof pageInfo === 'object',
    `ctx.render函数的参数格式为：${JSON.stringify({
    title: 'html>head>title的值',
    keyword: 'html>head>keyword的值',
    description: 'html>head>description的值',
    baseUrl: '静态资源的根路径，如：http://localhost:3004/static/',
    content: 'ReactDOMServer.renderToString|renderToStaticMarkup输出的字符串',
    state: 'ctx.store.getState()'
    })}，可传入空对象。`
  );

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>${pageInfo.title}</title>
    <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1"/>
    <meta name="referrer" content="no-referrer">
    <link href="${env.COOPERATION_URL}/cooperation-web.min.css" rel="stylesheet" type="text/css" />
    <link rel="shortcut icon" href="${baseUrl}/styles/default/images/bee.ico" type="images/x-icon">
    <link href="//design.yonyoucloud.com/static/antd/2.12.6/antd.min.css" rel="stylesheet" type="text/css" />
    ${loadCss}
  </head>
  <body>
    <div id="container" class="ncc-container">${content}</div>
    <div id="popup-container"></div>
    <script>
      window.__INITIAL_STATE__ = ${JSON.stringify(state)}
      window._baseUrl = '${HTTP_PREFIX}' || ''
      window.__PRINT_META__ = ${JSON.stringify(printMeta)}
      window.__SERVICE_BASEURL__ = "${serviceBaseUrl}"
      window.__configEnv__ = ${JSON.stringify(staticEnv)}
    </script>

    <script src="${env.HTTP_WORKFLOW_SERVER}/iform_web/s/tpl"></script>
    <script src="//cdn.yonyoucloud.com/pro/diwork/download/jDiwork.js"></script>
    <script src="${env.COOPERATION_URL}/cooperation-web.min.js"></script>
    <script src="${baseUrl}/scripts/vendor${suffix}.js${random}"></script>
    <script src="${baseUrl}/javascripts/${pageInfo.entryPoint}${suffix}.js${random}"></script>
    <script src="${baseUrl}/scripts/font.js${random}"></script>
  </body>
</html>`;
}
