import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { loadData as loadMenu, execute as execMenu, MenuItems, HangSolutionReceipt, OnlyResumeReceipt } from './menu';
import { loadData as loadAction, showModal as execAction, ActionItems } from './actions';
import { print as execPrint } from './receiptPrinter';
import { loadConfig, loadQuickPaymodes, loadPayment } from './paymode';
import { deleteProduct, handleFurnitureBill, _transferRefer2Bill } from './product';
import initShortcut from './../../../components/billing/initShortcut.js'

import { execute as execPending } from './cancelPending';
import { defaultSettle, shortcutSettle, toggleDelZero } from './paymode'
import { showOperator } from './operator'
import { showLock } from './lockscreen'
import { clear, init as initMeta, loadOptions, loadFunctionOptions, writeOriginBillMember } from './mix';
import { setMemberBoxFocus, queryMemberDefines } from './member';
import { setSearchBoxFocus } from './goodsRefer';
import { showSalesClerkModal } from './salesClerk';
import { getServiceData } from './touchRight';
import env from 'src/server/env';

let PendingMergeCommand = null;
const PrintOnOffCommand = 'PrintOnOff';
const RecognitionPhotoCommand = 'RecognitionPhoto';
const funcData = {};
const authData = {};
let billingTouchOptions = null;
let billingViewModel = null;

const $$initialState = Immutable.fromJS({
  data: null,
  showPrint: true,
  canPrint: true,
  viewModel: billingViewModel,
  showRecognitionPhoto: true
});

export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_CONFIG_INIT':
      return $$state.set('data', action.payload);
    case 'PLATFORM_UI_BILLING_CONFIG_PRINT_SHOW':
      return $$state.set('showPrint', action.payload);
    case 'PLATFORM_UI_BILLING_CONFIG_RECOGNITION_SHOW':
      return $$state.set('showRecognitionPhoto', action.payload);
    case 'PLATFORM_UI_BILLING_CONFIG_PRINT':
      return $$state.set('canPrint', action.payload);
    case 'PLATFORM_UI_BILLING_CONFIG_TOGGLE_PRINT':
      return $$state.set('canPrint', !$$state.get('canPrint'));
    case 'PLATFORM_UI_BILLING_CONFIG_SET_OPTIONS':
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_BILLING_VIEWMODEL_INIT':
      billingViewModel = action.payload;
      return $$state.set('viewModel', billingViewModel);
    case 'PLATFORM_UI_CONFIG_BILLING_CLEAR':
      billingViewModel = null
      return $$state.set('viewModel', null);
    default:
      return $$state;
  }
}

export function togglePrint () {
  return genAction('PLATFORM_UI_BILLING_CONFIG_TOGGLE_PRINT');
}

const processBillFunctionKey = (item, functionKeys) => {
  const { command, hotKey, positionNumber, name, isHasAuth } = item;
  item.key = command;
  funcData[item.key] = name;
  authData[item.key] = isHasAuth != null ? isHasAuth : true;
  if (!hotKey) return;
  item.hotKeyExec = hotKey;
  const index = hotKey.lastIndexOf('+');
  if (index !== -1)
    item.hotKey = hotKey.substr(index + 1);
  if (!functionKeys[positionNumber])
    functionKeys[positionNumber] = [];
  functionKeys[positionNumber].push(item);
}

export function initConfig (data, paramsObj) {
  return function (dispatch) {
    // console.log('开单设置数据：' + JSON.stringify(data, null, '\t'));
    const OptionData = data.optionData;
    const BillFunctionKeys = data.billFunctionKeys.sort((a, b) => {
      return a.orderBy - b.orderBy;
    });
    const ShowLines = data.showLines.sort((a, b) => {
      return a.orderBy - b.orderBy;
    });
    const PayFunctionKeys = data.payFunctionKeys.sort((a, b) => {
      return a.orderBy - b.orderBy;
    });
    billingTouchOptions = data.touchBillData;
    cb.rest.AppContext.storeOption = data.storeData
    /* add by jinzh1 取回触屏开单设置后 如果为触屏模式  获取数据 */
    const touchRoutePC = data && data.touchBillData && data.touchBillData.basicSettingData && data.touchBillData.basicSettingData.selectType === '2';
    dispatch(genAction('PLATFORM_UI_BILLING_CONFIG_SET_OPTIONS', { touchRoutePC }))
    if (env.INTERACTIVE_MODE === 'touch' && !touchRoutePC)
      dispatch(getServiceData());
    if (env.INTERACTIVE_MODE === 'touch' && touchRoutePC)
      dispatch(isGetPriceTable(true))
    dispatch(genAction('PLATFORM_DATA_USER_ACCOUNT_MERGE_INFO', { billingLogo: data.retailLogo }));
    const options = {};
    OptionData && OptionData.forEach(item => {
      const { name, value, defaultvalue, caption } = item;
      options[name] = { value: value == null ? defaultvalue : value, caption };
    });
    options.billgoodsreference && options.billgoodsreference.value && dispatch(genAction('PLATFORM_UI_GOODS_REFER_DATA_IS_TREE_OR_TABLE'));
    dispatch(genAction('PLATFORM_UI_BILLING_CONFIG_PRINT', options.ticketprint && options.ticketprint.value));
    const priceDecimal = options.monovalentdecimal && options.monovalentdecimal.value || 2;
    const moneyDecimal = options.amountofdecimal && options.amountofdecimal.value || 2;
    dispatch(genAction('PLATFORM_UI_BILLING_SET_OPTIONS', { priceDecimal, moneyDecimal }));
    dispatch(loadOptions(options));
    if (!BillFunctionKeys || !BillFunctionKeys.length) {
      cb.utils.alert('BillFunctionKeys error', 'error');
      return;
    }
    // 1左侧：锁屏、预订、交货、退订、退货（非原单退货、原单退货）、打小票、开钱箱、挂单（挂单并打印）、补单，位置固定
    // 2上部：会员录入、商品录入：非功能键，仅快捷键跳转到文本框；会员信息，位置固定；退货商品（复选框，非功能键，位置固定）
    // 3顶部：打印开关（图标，快捷键操作），位置固定
    // 4下部：新开单、积分抵扣、促销活动、现场折扣、优惠券、改行、数量、改零售价、周边库存，顺序起作用；营业员（位置固定）
    // 5行：选择规格、删行（支持快捷键操作），顺序不起作用
    // 6右上：修改（表头），位置固定
    // 7右下：抹零（选项）、默认结算方式、结算，位置固定
    const functionKeys = { 0: [{ hotKeyExec: 'Escape', command: 'ExitBilling' }] };
    const originalData = {}; const recognitionData = {} // 物体识别;
    BillFunctionKeys.forEach(item => {
      processBillFunctionKey(item, functionKeys);
      if (item.children) {
        item.children.forEach(childItem => {
          processBillFunctionKey(childItem, functionKeys);
        });
      }
      const { positionNumber, command } = item;
      if(command.toLocaleLowerCase().indexOf('recognition') >= 0)
        recognitionData[command] = item;
      if (!originalData[positionNumber])
        originalData[positionNumber] = [];
      originalData[positionNumber].push(item);
    });
    const pendingMenus = (functionKeys[1] || []).filter(item => {
      return item.command === HangSolutionReceipt || item.command === OnlyResumeReceipt;
    })
    if (pendingMenus.length === 2 && pendingMenus[0].hotKeyExec === pendingMenus[1].hotKeyExec) {
      PendingMergeCommand = `${HangSolutionReceipt},${OnlyResumeReceipt}`;
      pendingMenus[0].command = PendingMergeCommand;
      pendingMenus[1].command = PendingMergeCommand;
    }
    if(!recognitionData[RecognitionPhotoCommand]) {
      dispatch(genAction('PLATFORM_UI_BILLING_CONFIG_RECOGNITION_SHOW', false));
    }
    const showPrint = functionKeys[3] && functionKeys[3].find(item => {
      return item.command === PrintOnOffCommand;
    });
    if (!showPrint)
      dispatch(genAction('PLATFORM_UI_BILLING_CONFIG_PRINT_SHOW', false));
    dispatch(loadMenu(originalData[1], authData));
    dispatch(loadAction(originalData[4]));
    dispatch(loadConfig(originalData[7], options.malingdefault));
    dispatch(loadQuickPaymodes(originalData[8]));
    PayFunctionKeys.forEach(item => {
      // 暂时取消，后续启用
      // if (!item.isEnable) return;
      item.hotKeyExec = item.hotKey;
      // let index = item.hotKey.lastIndexOf('+');
      /* if (index !== -1)
        item.hotKey = item.hotKey.substr(index + 1); */
    });
    /* const settleFunctionKey = originalData[7].filter(item => {
      return item.command === 'Settle';
    }); */

    const quantityAddMinus = BillFunctionKeys.find(item => {
      return item.command === 'QuantityAddMinus' && item.isEnable == true;
    })
    quantityAddMinus && dispatch(loadFunctionOptions(quantityAddMinus, 'quantityAddMinus'))

    dispatch(loadPayment(PayFunctionKeys.filter(item => item.command !== 'PaySettle'), PayFunctionKeys));

    if (cb.rest.terminalType !== 3) initShortcut(functionKeys, dispatch)

    if (!ShowLines || !ShowLines.length) {
      cb.utils.alert('ShowLines error', 'error');
      return;
    }
    dispatch(initMeta(data.billHead, ShowLines, paramsObj));
  }
}

export function init () {
  return async function (dispatch) {
    // 找不到getConfig的定义，因此将此段注释

    // const config = {
    //   url: 'billTemplateSet/getBelongTemplate',
    //   method: 'GET'
    // };
    // const json = await proxy(config);
    // if (json.code !== 200) return;
    // dispatch(getConfig(json.data));

  }
}

// 除“现场折扣”“开钱箱”“原单退货”“非原单退货”“删行”等按钮外，若当前操作员无按钮的功能权限，则给出提示“操作员A没有XXX按钮的功能权限，不能操作”
const specialAuthCheckItems = ['SceneDiscount', 'OpenCashDrawer', 'FormerBackBill', 'NoFormerBackBill', 'DeleteRow'];

export function getAuthData () {
  return authData;
}

export function executeAction (key, data) {
  return function (dispatch, getState) {
    const billingStatus = getState().uretailHeader.toJS().billingStatus;
    const lineConnection = getState().offLine.get('lineConnection');
    if (env.INTERACTIVE_MODE === 'touch' && !lineConnection && key !== 'InputEmployee' && key !== 'DeleteRow') {
      cb.utils.alert('当前网络不可用，不能使用此功能!', 'error')
      return
    }
    if (!beforeExecAction(key)) return
    if (MenuItems.indexOf(key) > -1)
      return dispatch(execMenu(key));
    if (ActionItems.indexOf(key) > -1) {
      if (!beforeExecBottomAction(key)) return
      return dispatch(execAction(key));
    }
    if ((billingStatus == 'OnlineBackBill') && (key == 'OnlyResumeReceipt' || key == 'HangSolutionReceipt' || key == 'ResumePrint')) {
      cb.utils.alert('电商订单退货不能进行挂单解挂操作！', 'error')
      return
    }
    if (specialAuthCheckItems.indexOf(key) === -1 && authData[key] === false) {
      const userName = getState().user.toJS().name;
      const actionName = funcData[key];
      cb.utils.alert(`操作员${userName}没有${actionName}按钮的功能权限，不能操作`, 'error');
      return;
    }
    if (!beforeExecOtherAction(key)) return
    switch (key) {
      case 'ExitBilling':
        cb.utils.confirm('是否退出开单界面？', function () {
          window.close();
        });
        break;
      case 'VIPEnterDiscount':
        dispatch(setMemberBoxFocus(true));
        break;
      case 'EnterItem':
        dispatch(setSearchBoxFocus(true));
        break;
      case OnlyResumeReceipt:
      case HangSolutionReceipt:
      case PendingMergeCommand:
        dispatch(execPending());
        break;
      case PrintOnOffCommand:
        dispatch(togglePrint());
        break;
      case 'ResumePrint':
        dispatch(execPending(true));
        break;
      case 'DeleteZero':
        dispatch(toggleDelZero(true))
        break;
      case 'Settle':
        dispatch(defaultSettle());// 默认结算
        break;
      case 'QuickPay':
        dispatch(shortcutSettle(data.paymethodId));// 快捷结算
        break;
      case 'ClearReceipt':
        dispatch(clear());
        break;
      case 'DeleteRow':
        dispatch(deleteProduct(data, authData[key]));
        break;
      case 'OpenCashDrawer':/* 开钱箱 */
        dispatch(showOperator(true, false, 'opencashbox', 'RM10'));
        break;
      case 'LockedScreen':/* 锁屏 */
        dispatch(showLock());
        break;
      case 'PrintLastReceipt': {
        const canPrint = getState().config.toJS().canPrint;
        if (canPrint)
          dispatch(execPrint());
        else
          cb.utils.alert('当前状态不允许打小票', 'error');
        break;
      }
      case 'InputEmployee':/* 营业员 */
        dispatch(showSalesClerkModal());
        break;
      case 'AddMember':/* 新增会员 */
        dispatch(queryMemberDefines());
        break;
    }
    if (!billingViewModel) {
      cb.utils.alert('正在初始化，请稍后重试', 'error');
      return;
    }
    if (billingViewModel.hasEvent(key)) {
      billingViewModel.execute(key, warpTransfer(dispatch, handleFurnitureBill), _transferRefer2Bill);
    }
  }
}

const warpTransfer = (dispatch, handleFurnitureBill) => {
  return function (bills, billingStatus, noInitMember) {
    if (!bills || !Array.isArray(bills)) return
    let products = []
    bills.forEach(bill => {
      const { rm_retailvouch } = bill
      const { retailVouchDetails, iMemberid } = rm_retailvouch
      products = products.concat(retailVouchDetails);
      if(!noInitMember) writeOriginBillMember(dispatch, iMemberid)
      billingViewModel.loadData(rm_retailvouch);
      dispatch(genAction('PLATFORM_UI_BILLING_REFER_BILL_OK', { status: billingStatus || 'CashSale', data: rm_retailvouch }));
    })
    dispatch(handleFurnitureBill(products))
  }
}

export function isGetPriceTable (send) {
  return function (dispatch) {
    if (cb.rest.interMode === 'touch' && !send) return
    const config = {
      url: 'thirdparty/mall/querypromotion',
      method: 'GET'
    }
    proxy(config).then(json => {
      if (json.code !== 200) {
        cb.utils.alert(json.message, 'error');
        return
      }
      dispatch(genAction('PLATFORM_UI_BILLING_CONFIG_GET_IS_GET_PRICE_TABLE', json.data))
    })
  }
}

const beforeExecBottomAction = (key) => {
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeExecBottomAction', {key, })
}

const beforeExecOtherAction = (key) => {
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeExecOtherAction', {key, })
}

const beforeExecAction = (key) => {
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeExecAction', {key, })
}

export function getBillingTouchOptions () {
  return billingTouchOptions;
}

export function getBillingViewModel () {
  return billingViewModel
}
