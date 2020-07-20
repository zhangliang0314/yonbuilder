import Immutable from 'immutable';
import { genAction } from '@mdf/cube/lib/helpers/util';
import _ from 'lodash';
import BillingStatus from './billingStatus';
import { ModifyBillStatus } from './uretailHeader';
import { showReserve } from './reserve';
import { backBill } from './backBill';
// import { deliver } from './deliver';
import { unsubscribe } from './unsubscribe';
import { aftersalerefer } from './aftersalerefer';
import { ECommerce } from './eCommerce';
import { ECommerceBack } from './eCommerceBack'
import { showRepair } from './repair'
import { setSearchBoxFocus } from './goodsRefer';
import { canOpen } from './backBill';
import status from './billingStatus';
import { clear } from './mix';

export const HangSolutionReceipt = 'HangSolutionReceipt';
export const OnlyResumeReceipt = 'OnlyResumeReceipt';

let configMenu = null;
let authData = null;
let isReceiptHang = true;

// let menuObj = {
//   OrderBill: { type: 'yuding' }, // 订货
//   PresellBill: { type: 'yuding' }, // 预订
//   Shipment: { type: 'jiaohuo' }, // 交货
//   PresellBack: { type: 'tuiding' }, // 退订
//   BackBill: { type: 'tuihuo' }, // 退货
//   FormerBackBill: { type: 'tuihuo' }, // 原单退货
//   NoFormerBackBill: { type: 'tuihuo' }, // 非原单退货
//   ResumeReceipt: { type: 'guadan' }, // 挂单
//   OnlyResumeReceipt: { type: 'guadan' },// 仅挂单
//   ResumePrint: { type: 'guadan' }, // 挂单并打印
//   HangSolutionReceipt: { type: 'jiegua' }, // 解挂
//   RepairReceipt: { type: 'budan' }, // 补单
//   PrintLastReceipt: { type: 'daxiaopiao' }, // 打小票
//   OpenCashDrawer: { type: 'kaiqianxiang' }, // 开钱箱
//   LockedScreen: { type: 'jiesuo' }, // 锁屏
//   AfterSaleService: { type: 'shouhou' }, // 售后
//   OnlineBill: { type: 'dianshang' }, // 电商

// };

const MenuExecuteMap = {
  PresellBill: { text: '预订' },
  // Shipment: { text: '交货' },
  // PresellBack: { text: '退订' },
  FormerBackBill: { text: '退货' },
  NoFormerBackBill: { text: '退货' },
  OnlineBackBill: { text: '电商退货' },
  OnlineBill: { text: '电商订单' },
  RepairReceipt: { text: '补单' },
  AfterSaleService: { text: '售后' }
};
const menuItems = [];
_.forEach(MenuExecuteMap, (item, key) => {
  item.mode = BillingStatus[key];
  menuItems.push(key);
});
export const MenuItems = menuItems;

const $$initialState = Immutable.fromJS({
  menuData: [], // 左侧栏
  isReceiptHang,
  leftMenuIsOpen: true,
  isMounted: false
});

// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_LOAD_LEFT_MENU':
      return $$state.merge(action.payload);
    // 切换左侧栏的展开状态
    case PLATFORM_UI_BILLING_TOGGLE_LEFTMENU:
      return $$state.update('leftMenuIsOpen', v => !v)
    default:
      return $$state;
  }
}

/* add by jinzh1  clear */
export function clearMenu () {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_LOAD_LEFT_MENU', {
      menuData: [], // 左侧栏
      isReceiptHang,
      isMounted: false
    }));
    configMenu = null;
    authData = null;
    isReceiptHang = true;
  }
}

// 切换左侧栏的展开状态
const PLATFORM_UI_BILLING_TOGGLE_LEFTMENU = 'PLATFORM_UI_BILLING_TOGGLE_LEFTMENU'
export function toggleLeftMenu () {
  return {
    type: PLATFORM_UI_BILLING_TOGGLE_LEFTMENU,
  }
}

const buildMenuItem = (item) => {
  const { key, name, hotKey, icon } = item;
  return { key, type: icon, title: name, hotKey };
}

const buildMenu = () => {
  const ignoreMenus = isReceiptHang ? ['ResumeReceipt', OnlyResumeReceipt, 'ResumePrint'] : [HangSolutionReceipt];
  const menuData = [];
  if (configMenu) {
    configMenu.forEach(item => {
      if (ignoreMenus.indexOf(item.key) > -1) return;
      const newItem = buildMenuItem(item);
      if (item.children) {
        newItem.items = [];
        item.children.forEach(childItem => {
          newItem.items.push(buildMenuItem(childItem));
        })
      }
      menuData.push(newItem);
    });
  }
  return genAction('PLATFORM_UI_BILLING_LOAD_LEFT_MENU', { menuData, isReceiptHang });
};

export function loadData (data, auth) {
  return function (dispatch) {
    configMenu = data.sort((a, b) => {
      return a.orderBy - b.orderBy;
    });
    authData = auth;
    dispatch(buildMenu());
  }
}

export function setReceiptHang (value) {
  isReceiptHang = value;
  return buildMenu();
}

export function execute (key) {
  return function (dispatch, getState) {
    const billingStatus = getState().uretailHeader.toJS().billingStatus;
    const currentText = MenuExecuteMap[key].text;
    const products = getState().product.toJS().products;
    const backRow = products.filter(product => {
      return product.fQuantity < 0;
    })
    if ((billingStatus === status.OnlineBill && MenuExecuteMap[key].mode == status.OnlineBill) || (billingStatus === status.OnlineBackBill && MenuExecuteMap[key].mode == status.OnlineBackBill)) {
      dispatch(clear());
      return;
    }
    if (backRow && backRow.length > 0 && (MenuExecuteMap[key].mode == status.FormerBackBill || MenuExecuteMap[key].mode == status.NoFormerBackBill)) {
      dispatch(clear());
      return;
    }
    if (billingStatus === status.Shipment && MenuExecuteMap[key].mode == status.Shipment) {
      dispatch(clear());
      return;
    }
    if (billingStatus === status.AfterSaleService && MenuExecuteMap[key].mode == status.AfterSaleService) {
      dispatch(clear());
      return;
    }

    if (billingStatus === status.PresellBack && MenuExecuteMap[key].mode == status.PresellBack) {
      dispatch(clear());
      return;
    }

    if (products && products.length > 0 && MenuExecuteMap[key].mode !== billingStatus) {
      cb.utils.alert(`已存在商品行，不能进行${currentText}`, 'error');
      return;
    }
    // if (!isReceiptHang) {
    //   cb.utils.alert(`已存在商品行，不能进行${currentText}`, 'error');
    //   return;
    // }
    if (billingStatus !== BillingStatus.CashSale && billingStatus !== MenuExecuteMap[key].mode) {
      cb.utils.alert(`${MenuExecuteMap[billingStatus].text}状态下不能进行${currentText}`, 'error');
      return;
    }
    let errMsg = ''; const hasAuth = authData[key];
    switch (key) {
      case 'PresellBill':
        if (!hasAuth) {
          errMsg = '预定'
          break;
        }
        dispatch(showReserve());
        break;
      case 'Shipment':
        if (!hasAuth) {
          errMsg = '交货'
          break;
        }
        dispatch(unsubscribe(true, key));/* 交货 同退订 */
        break;
      case 'PresellBack':
        if (!hasAuth) {
          errMsg = '退订'
          break;
        }
        dispatch(unsubscribe(true, key));/* 退订 */
        break;
      case 'FormerBackBill':/* 原单退货 */
        dispatch(canOpen(key, authData[key], () => {
          dispatch(backBill('', '', '', '', '', true));
        }));
        break;
      case 'NoFormerBackBill':/* 非原单退货 */
        dispatch(canOpen(key, authData[key], () => {
          dispatch(ModifyBillStatus(BillingStatus.NoFormerBackBill));
          dispatch(setSearchBoxFocus(true));
        }));
        break;
      case 'OnlineBill': /* 电商订单 */
        if (!hasAuth) {
          errMsg = '电商'
          break;
        }
        dispatch(ECommerce(true));
        break;
      case 'RepairReceipt':/* 补单 */
        if (!hasAuth) {
          errMsg = '补单'
          break;
        }
        dispatch(showRepair());
        break;
      case 'AfterSaleService':
        if (!hasAuth) {
          errMsg = '售后'
          break;
        }
        if (!authData[key]) {
          cb.utils.alert('当前操作员没有售后权限！', 'error');
          return;
        }
        // dispatch(ModifyBillStatus(BillingStatus.AfterSaleService));
        // dispatch(getDefaultBusinessType('8'));
        dispatch(aftersalerefer(true, key));
        // dispatch(setSearchBoxFocus(true));
        break;
      case 'OnlineBackBill':
        // if (!hasAuth) {
        //   errMsg = '电商退货'
        //   break;
        // }
        dispatch(canOpen(key, authData[key], () => {
          dispatch(ECommerceBack(true));
        }));
        break;
    }
    if (errMsg && errMsg != '') {
      const userName = getState().user.toJS().name;
      cb.utils.alert(`操作员${userName}没有${errMsg}按钮的功能权限，不能操作！`, 'error');
    }
  }
}
