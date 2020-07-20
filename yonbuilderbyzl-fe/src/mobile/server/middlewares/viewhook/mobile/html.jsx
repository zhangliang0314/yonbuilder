import env from '../../../env'

const isDev = process.env.NODE_ENV === 'development';
const baseUrl = env.HTTP_SCRIPT_BASEURL
const suffix = env.HTTP_SCRIPT_SUFFIX
const random = isDev ? '' : `?_=${env.STATIC_RANDOM_SUFFIX}`;
// 开发环境使用样式热更新, 不再用打包后的独立css文件
const loadCss = process.env.NODE_ENV === 'development' ? '' : `<link href="${baseUrl}/styles/default/mobile.index.min.css" rel="stylesheet" type="text/css" />`
export default function html () {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, minimal-ui">
    <title>友零售</title>
     <script src="https://as.alipayobjects.com/g/component/fastclick/1.0.6/fastclick.js"></script>
     <script>
     //根据屏幕大小改变根元素字体大小
(function(doc, win) {
    window._dbVersion = 1;
    window._dbTables = ['billNodata', 'business']
    window.__fontUnit = 0
    var docEl = doc.documentElement,
       // resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
        recalc = function() {
            var clientWidth = docEl.clientWidth;
            if (!clientWidth) return;
            if (clientWidth >= 750) { //750这个值，根据设计师的psd宽度来修改，是多少就写多少，现在手机端一般是750px的设计稿，如果设计师给的1920的psd，自己用Photoshop等比例缩小
                window.__fontUnit = 100;
                docEl.style.fontSize = window.__fontUnit + 'px';

            } else {
                window.__fontUnit = 100 * (clientWidth / 750);
                docEl.style.fontSize = window.__fontUnit + 'px'; //750这个值，根据设计师的psd宽度来修改，是多少就写多少，现在手机端一般是750px的设计稿，如果设计师给的1920的psd，自己用Photoshop等比例缩小
            }
        };

    if (!doc.addEventListener) return;
 //   win.addEventListener(resizeEvt, recalc, false);
    doc.addEventListener('DOMContentLoaded', recalc, false);

})(document, window);

</script>
  <script>
    if ('addEventListener' in document) {
      document.addEventListener('DOMContentLoaded', function () {
        FastClick.attach(document.body);
      }, false);
    }
    if (!window.Promise) {
      document.writeln('<script src="https://as.alipayobjects.com/g/component/es6-promise/3.2.2/es6-promise.min.js"' + '>' + '<' + '/' + 'script>');
    }
  </script>
    <link href="//iuap-design-cdn.oss-cn-beijing.aliyuncs.com/static/antd-mobile/antd-mobile.css" rel="stylesheet" type="text/css" />
    ${loadCss}
  </head>
  <body>
    <div id="container"></div>
    <div id="popup-container"></div>
    <script src="${baseUrl}/scripts/vendor${suffix}.js${random}"></script>
    <script src="${baseUrl}/javascripts/mobile.index${suffix}.js${random}"></script>
    <script type="text/javascript" src="https://webapi.amap.com/maps?v=1.3&key=96d6d8fa0688a1c266dc50e009efc773"></script>
    <script src="//webapi.amap.com/ui/1.0/main.js?v=1.0.10"></script>
    <script src="${baseUrl}/scripts/mobile.font.js${random}"></script>
    <script src="https://res.wx.qq.com/open/js/jweixin-1.3.2.js"></script>
  </body>
</html>`
}
