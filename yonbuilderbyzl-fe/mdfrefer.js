//参照打包的入口文件
import '@yonyou/mdf-refer/lib/support_cb';
import 'yonui-ys/lib/theme/filtercontainer';
// import '@mdf/theme/theme-default/filtercontainer'

// register businessContext
const businessContext = require.context('business');
cb.registerBusinessContext(businessContext)