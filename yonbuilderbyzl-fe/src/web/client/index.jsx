require('@babel/polyfill')
const Sentry = require('@sentry/browser')
if (process.env.SENTRY_DSN) {
  Sentry.init({dsn: process.env.SENTRY_DSN})
}

const cb = require('@mdf/cube/lib/cube')
console.log(' ====process.env.LANG=== ', process.env.__LANG__);
if(process.env.__LANG__ && process.env.__LANG__ == true) {
  cb.lang.jsonp(0, 'YS_BEE_FED_UCFBASEDOC,YS_BEE_FED_UCF-STAFF-FE');
  cb.lang.init(require('../../pack'), null);
  console.log(' ************************多语加载成功!***************************');
  console.log(cb.lang.template('YS_FI_FP_0000033576'));
}
const extendConfig = require('../common/config.comp').default;
const { setCompConfig, setExtendComp } = require('@mdf/cube/lib/extend')
const extendComp = require('../common/registerMetaComp').default;
const basicComponents = require('../common/components').default
// extendConfig.iconfont && require('@mdf/theme-ncc/dist/font_ncc/iconfont');
setCompConfig(extendConfig)
// register extend components
setExtendComp(basicComponents)
setExtendComp(extendComp)

// register businessContext
const businessContext = require.context('business')
cb.registerBusinessContext(businessContext)

cb.rest.nodeEnv = process.env.NODE_ENV;

require('./client')
