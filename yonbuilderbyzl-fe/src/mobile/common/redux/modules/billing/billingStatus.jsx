import keyMirror from 'keymirror'

export default keyMirror({
  CashSale: 'CashSale', /* 现销 */
  PresellBill: 'PresellBill', /** 预订 */
  Shipment: 'Shipment', /* 交货 */
  PresellBack: 'PresellBack', /* 退订 */
  FormerBackBill: 'FormerBackBill', /* 原单退货 */
  NoFormerBackBill: 'NoFormerBackBill', /* 非原单退货 */
  OnlineBackBill: 'OnlineBackBill', /* 电商退货 */
  OnlineBill: 'OnlineBill', /* 电商 */
  AfterSaleService: 'AfterSaleService'
})
