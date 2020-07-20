import Immutable from 'immutable';
import { genAction } from '@mdf/cube/lib/helpers/util';
import { Format } from '@mdf/cube/lib/helpers/formatDate';
import { scanEnter } from './touchRight';
import { queryMember } from './member';
import { print } from './receiptPrinter';
import { clear } from './mix';
// import { push, goBack } from 'react-router-redux'
import _ from 'lodash'
import { toggleSettleStatus } from './paymode';
import { save_mobile } from 'src/common/redux/modules/billing/mix'
import { dealReferReturnProducts } from 'src/common/redux/modules/billing/product'

const initialState = {
  visible: false,
  memberVisible: false,
  successVisible: false,
  settleVisible: false,
  scanEntry: 'product', /* product: 商品; member: 会员; settle: 结算 */
  afterSaveData: '',
  showView: 'cart', // 'cart': 购物车，'refer': 参照
  selfOptionData: {},
}

export default function ($$state = Immutable.fromJS(initialState), action) {
  switch(action.type) {
    case 'PLATFORM_UI_BILLING_SELF_SET_COMMON':
      dealCartScanEntry(action.payload)
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_BILLING_SELF_GET_SELF_TEMPLATE':
    case 'PLATFORM_UI_BILLING_SELF_SET_OPTIONS':
    case 'PLATFORM_UI_BILLING_SELF_GET_SAVE_DATA':
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_BILLING_CLEAR':
      return $$state.merge({
        visible: false,
        memberVisible: false,
        successVisible: false,
        settleVisible: false,
        scanEntry: 'product', /* product: 商品; member: 会员; settle: 结算 */
        afterSaveData: '',
        showView: 'cart', // 'cart': 购物车，'refer': 参照
      })
    default:
      return $$state
  }
}

export const setCommon = (obj) => {
  return (dispatch) => {
    dispatch(genAction('PLATFORM_UI_BILLING_SELF_SET_COMMON', obj))
  }
}

export const setOptions = (obj) => {
  return (dispatch) => {
    dispatch(genAction('PLATFORM_UI_BILLING_SELF_SET_OPTIONS', obj))
  }
}

const dealCartScanEntry = (dataSource) => {
  if (dataSource.visible !== undefined || dataSource.memberVisible === false)
    dataSource.scanEntry = 'product'
  if (dataSource.memberVisible === true)
    dataSource.scanEntry = 'member'
  return dataSource
}

// export function selfSave(){
//     return function(dispatch, getState){
//         let allState = getState();
//         let products = allState.product.get('products');
//         if(Immutable.List.isList(products)) products = products.toJS();
//         let onSettle = allState.paymode.get('onSettle');
//         let paymodes = allState.paymode.get('paymodes');
//         if(Immutable.Map.isMap(paymodes)) paymodes = paymodes.toJS();

//         if (_.isEmpty(products) || onSettle) return
//         if (!this.validateSettle())

//         let promises = [];

//     }
// }

export function acceptScanResult (result) {
  return function (dispatch, getState) {
    const scanEntry = getState().selfProduct.get('scanEntry');
    switch(scanEntry) {
      case 'product': {
        const date = Format(new Date(), 'yyyy-MM-dd hh:mm:ss');
        const showView = getState().selfProduct.get('showView');
        if(showView === 'refer')
          dispatch(genAction('PLATFORM_UI_BILLING_SELF_SET_OPTIONS', {showView: 'cart'}))
        dispatch(scanEnter(result, date, true, true));
        if(window.location.pathname === '/billing/self')
          cb.route.pushPage('/billing/self/cart')
        window.sendSef('audio', '')
        window.__self__type = 'add'
        return
      }
      case 'member': {
        let memberListDoms = getState().member.get('memberListDoms');
        if(Immutable.List.isList(memberListDoms)) memberListDoms = memberListDoms.toJS()
        dispatch(queryMember(result, memberListDoms, null, true, '', true))
        return
      }
      case 'settle':
        dispatch(handleSettle('', result))
    }
  }
}

/* 自助大屏选择商品带入开单 */
export const selfCartToBilling = (callback) => {
  return function (dispatch, getState) {
    let cartInfo = getState().goodsRefer.get('cartInfo');
    if(Immutable.Iterable.isIterable(cartInfo)) cartInfo = cartInfo.toJS()
    // let { products } = getState().product.toJS();
    // let time = (new Date()).getTime();
    const data = cartInfo.cartData;
    if (!data || data.length == 0) {
      //   dispatch(goBack());
      cb.utils.alert('请选择商品！', 'error')
      return;
    }
    const finalData = { sku: data }
    dispatch(dealReferReturnProducts(finalData))
    callback && callback()
    // dispatch(goBack())
    dispatch(genAction('URETAIL_MOBILE_GOODSREFER_CLEAR'))
  }
}

/* 结算的校验 */
export const canRouteSettle = () => {
  return async (dispatch, getState) => {
    // let canOpen = await canOpenSettleModal(getState, dispatch)
    // if (!canOpen) return
    dispatch(genAction('PLATFORM_UI_BILLING_SELF_SET_COMMON', { settleVisible: true, scanEntry: 'settle'}))
    window.sendSef('payAlarm', '')
  }
}

/* 大屏的打印 */
export const selfPrint = (data) => {
  return function (dispatch, getState) {
    const canPrint = getState().config.get('canPrint');
    if (canPrint)
      dispatch(print(data));
    dispatch(clear(false));
  }
}

/* 大屏结算 */
export const handleSettle = (arg1, scanResult) => {
  return function (dispatch, getState) {
    const allState = getState();
    const onSettle = allState.paymode.get('onSettle');
    let products = allState.product.get('products')
    if (Immutable.List.isList(products)) products = products.toJS();

    // const isQuickPay = arg1 === 'quickPay'

    // const {onSettle} = this.props.paymode
    // const {products} = this.props.product
    if (_.isEmpty(products) || onSettle) return

    // const that = this

    // if (!this.validateSettle()) return
    // this.props.paymodeActions.toggleSettleStatus(true)
    toggleSettleStatus(true)

    // const {paymodes} = this.props.paymode
    // const addCard = this.props.addCard
    // let paymodes = allState.paymode.get('paymodes');

    // let promises = []
    // 过滤在使用的支付方式并且根据paymentType的值排序决定同步执行的顺序
    // const finallyPaymodes = _.sortBy(_.filter(paymodes, paymode => paymode.show && paymode.value != 0), 'paymentType')
    // _.forEach(finallyPaymodes, (paymode) => {
    // if (paymode.paymentType == 3 || paymode.paymentType == 4 || paymode.paymentType == 5 || paymode.paymentType == 10) {
    //     promises.push(() => {
    //     return this.inputConfirm(paymode, isQuickPay)
    //     })
    // } else if (paymode.paymentType == 6 || paymode.paymentType == 7 || paymode.paymentType == 8) {
    //     promises.push(() => {
    //     return this.changjiePay(paymode, isQuickPay)
    //     })
    // } else if (paymode.paymentType == 11) {
    //     promises.push(() => {
    //     return this.changjiePay(paymode, isQuickPay, 'sandPay')
    //     })
    // } else {
    //     if (isQuickPay) {
    //     loadingModal = openLoadingModal()
    //     }
    // }
    // })
    let payment = allState.paymode.get('payment');
    if (Immutable.Map.isMap(payment)) payment = payment.toJS();
    /* 是否有收钱吧 */
    let isHave = false; let haveUnion = false;
    for(const attr in payment) {
      if (payment[attr].paymentType == 10) isHave = true
      if (payment[attr].paymentType == 22) haveUnion = true
    }

    const receivable = allState.product.getIn(['money', 'Gathering', 'value']); // 应收

    try{
      if (receivable > 0) {
        if(isHave) {
          dispatch(genAction('PLATFORM_UI_BILLING_SELF_ADD_PAYMODE', {
            _status: 'Insert',
            paymentType: 99998,
            fMoney: receivable,
            authCode: scanResult,
            show: true,
            value: receivable,
          }))
        }else if (haveUnion) {
          dispatch(genAction('PLATFORM_UI_BILLING_SELF_ADD_PAYMODE', {
            _status: 'Insert',
            paymentType: 99997,
            fMoney: receivable,
            authCode: scanResult,
            show: true,
            value: receivable,
          }))
        } else {
          dispatch(genAction('PLATFORM_UI_BILLING_SELF_ADD_PAYMODE', {
            _status: 'Insert',
            paymentType: 99999,
            fMoney: receivable,
            authCode: scanResult,
            show: true,
            value: receivable,
          }))
        }
        setTimeout(() => {
          dispatch(save_mobile((data) => {
            dispatch(genAction('PLATFORM_UI_BILLING_SELF_GET_SAVE_DATA', { afterSaveData: data, settleVisible: false}))
            cb.route.pushPage('/billing/self/success')
            window.sendSef('okAlarm', '')
          }, (message) => {
            if(message.includes('解析付款码不正确，长度不合法!')) {
              window.sendSef('checkPayCodeAlarm', '')
              cb.utils.alert('请出示正确的付款码！', 'error')
              return
            }
            console.log('大屏保存失败：' + message)
            cb.utils.alert('大屏保存失败：' + message, 'error')
          }))
        }, 0)
      }
    }catch (e) {
      toggleSettleStatus(false)
      console.log('catch:::::' + e)
      // that.props.paymodeActions.closePaymodal()
      cb.utils.alert('失败， 请重新结算', 'error')
    }

    // const finalSave = values => {
    // return new Promise((resolve, reject) => {
    //     if (this.receivable > 0) {
    //     addCard(values)
    //     }
    //     this.handleSave()
    //     resolve()
    // })
    // }

    // async function setInfoInOrder(promises) {
    //     let results = []
    //     try {
    //         for (let p of promises) {
    //         const result = await p()

    //         results.push(result)

    //         }
    //         await finalSave(results)
    //     } catch (e) {
    //         that.props.paymodeActions.toggleSettleStatus(false)
    //         that.props.paymodeActions.closePaymodal()
    //         cb.utils.alert({
    //         title: '失败， 请重新结算',
    //         type: 'error'
    //         })
    //     }

    // }

    // setInfoInOrder(promises)
  }
}
