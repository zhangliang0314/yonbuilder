require('@babel/polyfill')
const Sentry = require('@sentry/browser')
if (process.env.SENTRY_DSN) {
  Sentry.init({dsn: process.env.SENTRY_DSN})
}

const cb = require('@mdf/cube/lib/cube')
const envConfig = require('../common/config.env').default;
const extendConfig = require('../common/config.comp').default;
const { setEnvConfig, setCompConfig, setExtendComp } = require('@mdf/cube/lib/extend')
const extendComp = require('../common/registerMetaComp').default;

setEnvConfig(envConfig)
setCompConfig(extendConfig)
// register extend components
setExtendComp(extendComp)

// register businessContext
const businessContext = require.context('business')
cb.registerBusinessContext(businessContext)

cb.rest.nodeEnv = process.env.NODE_ENV;

require('./client')
