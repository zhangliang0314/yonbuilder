global.Canvas ={createCanvas:function(){}}
global.canvas ={createCanvas:function(){}}
/**
require('@babel/polyfill')
require('ignore-styles')
require('@babel/register')({
  ignore: [
    /node_modules\/(?!@mdf).*\//
  ]
})
**/
// node端虚拟window之类的数据 -- begin
const { JSDOM } = require('jsdom')
const { window } = new JSDOM('', {
  url: 'http://localhost/'
})
global.window = window
for (const item of ['document', 'navigator', 'location', 'localStorage', 'sessionStorage']) {
  global[item] = window[item]
}

Object.defineProperty(window, 'cb', {
  set: val => { global.cb = val },
  get: () => global.cb
})

require('matchmedia-polyfill');
require('matchmedia-polyfill/matchMedia.addListener');
// node端虚拟window之类的数据 -- end

// 获取当前主题
const packageJson = require('../../../package.json')
process.env.__THEMETYPE__ = packageJson.themeType

const envConfig = require('./env').default;
const extendConfig = require('../common/config.comp').default;
// if (process.env.MDF_LANG && process.env.MDF_LANG == 'true') {
//   const cb = {};
//   cb.lang = require('@mdf/cube/lib/lang');
//   cb.lang.setLanguage(require('../../../pack'), 'zh-CN');
//   console.log(' ************************server-多语加载成功!***************************');
//   console.log(cb.lang.template('YS_FI_FP_0000033576'));
//   global.cb = cb;
// }
const { setEnvConfig, setCompConfig } = require('@mdf/cube/lib/extend')

setEnvConfig(envConfig)
setCompConfig(extendConfig)

require('./server')
