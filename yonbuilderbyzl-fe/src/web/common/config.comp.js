let comp = {
  // --- 扩展 @mdf/cube 相关 开始---
  voucherExtendConfig: require('./extends/voucherExtend'), // 扩展 voucher.js 内方法
  voucherListExtendConfig: require('./extends/voucherListExtend'), // 扩展 voucherlist.js 内方法
  optionExtendConfig: require('./extends/optionExtend'), // 扩展 option.js 内方法
  freeviewExtendConfig: require('./extends/freeviewExtend'), // 扩展 freeview.js 内方法
  editVoucherListExtendConfig: require('./extends/editVoucherListExtend'), // 扩展 editvoucherlist.js 内方法
  dateLongFormat: false, // 日期组件是否支持long数据类型
  gridRowEditShow: true, // 表格行编辑直接显示态，而不是点击后才知晓编辑态
  // --- 扩展 @mdf/cube 相关 结束---
};
if (process.env.__THEMETYPE__ === 'ncc') {
  comp = Object.assign({}, comp, {
    iconfont: true
  }, require('@mdf/metaui-web-ncc/lib/components/config.comp').default);
}
export default comp;
