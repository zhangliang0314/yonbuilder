require('@babel/polyfill')
require('ignore-styles')

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

const envConfig = require('./env').default;
const extendConfig = require('../common/config.comp').default;
const { setEnvConfig, setCompConfig, setExtendComp } = require('@mdf/cube/lib/extend')
const extendComp = require('../common/registerMetaComp').default;

setEnvConfig(envConfig)
setCompConfig(extendConfig)
// register extend components
setExtendComp(extendComp)

require('./app.mobile')
