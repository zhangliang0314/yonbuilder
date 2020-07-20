/**
 * ys 扩展
 */
let extendComp = {
  basic: {},
  meta: {
    NCCTreeRefer: '',

  }
}
if(process.env.__THEMETYPE__ === 'ncc') {
  const {basic = {}, filter = {}, refer = {}} = require('@mdf/metaui-web-ncc').default;
  // 扩展 cControlType
  extendComp = {
    // 'basic': Object.assign({},{Input,Select,Refer,DatePicker,Filter,PageIcon,ReferToolbar,ReferModal,SearchTree}),
    basic: Object.assign({}, basic),
    filter: Object.assign({}, filter),
    refer: Object.assign({}, refer)
  }
}
export default extendComp;
