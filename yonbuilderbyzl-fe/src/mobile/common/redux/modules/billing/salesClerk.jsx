import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { addCacheProduct, handleOnlineBill, handleFurnitureBill } from './product';

// const employeeRefer2BillKeyFieldMap = {
//   id: 'iEmployeeid',
//   cName: 'iEmployeeid_name'
// };
let checkedEmployee = null;
let cacheProducts = null;
let onlineProducts = null;
let furnitureProducts = null;
let okCallBack = null;
let cRefRetId = {}
// let employeeMeta = {};
const $$initialState = Immutable.fromJS({
  salesChecked: '', // 选中的营业员
  inputValue: '', // 姓名||工号
  salesList: [], // 数据源
  checkedRow: {}, // 选中行数据
  modalVisible: false, // 弹出框显示控制
  defaultSalesClerk: {},
  AfterSaleService_CallBack: undefined,
  hasShow: false, /* 是否弹出过营业员选择 */
  cacheData: null, /* 登陆缓存数据 */
});

export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_SALES_SET_SALES_LIST': {
      return $$state.set('salesList', action.payload);
    }
    case 'PLATFORM_UI_BILLING_SALES_CHANGE_INPUT_VALUE':
      return $$state.set('inputValue', action.payload);
    case 'PLATFORM_UI_BILLING_SALES_CHECKED_ROW':
      return $$state.set('checkedRow', action.payload);
    case 'PLATFORM_UI_BILLING_SALES_SET_MODAL_VISIBLE':
    {
      if (action.payload === false) {
        return $$state.set('AfterSaleService_CallBack', undefined)
          .set('modalVisible', action.payload);
      }
      else
        return $$state.set('modalVisible', action.payload);
    }
    case 'PLATFORM_UI_BILLING_SALES_SET_MODAL_VISIBLE2':
    {
      return $$state.set('AfterSaleService_CallBack', action.payload);
    }
    case 'PLATFORM_UI_BILLING_SALES_SET_CHECKED':
      return $$state.set('salesChecked', action.payload);
    case 'PLATFORM_UI_BILLING_SALES_SET_COMMON_DATA':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_BILLING_EMPLOYEE_REFER_META':
      cRefRetId = JSON.parse(action.payload.cRefRetId ? action.payload.cRefRetId : '{}');
      if (!checkedEmployee || cb.rest.terminalType == 3) {
        checkedEmployee = {};
        const defaultSalesClerk = $$state.get('defaultSalesClerk').toJS();
        if (defaultSalesClerk.id) {
          const checkedRow = defaultSalesClerk;
          for (const attr in cRefRetId)
            checkedEmployee[attr] = checkedRow[cRefRetId[attr]];
          return $$state.set('employeeMeta', action.payload).merge({
            salesChecked: checkedRow.name,
            checkedRow
          });
        } else {
          return $$state.set('employeeMeta', action.payload);
        }
      } else {
        return $$state.set('employeeMeta', action.payload);
      }
    case 'PLATFORM_UI_BILLING_SET_FOCUSED_ROW': {
      /* add by jinzh1处理移动端交互 */
      // if (cb.rest.terminalType == 3) return $$state;

      const checkedRow = $$state.get('salesList') && $$state.get('salesList').find(function (item) {
        return item.id === action.payload.iEmployeeid;
      });
      // if (!action.payload.iEmployeeid)
      //   return $$state;
      if (!checkedRow) {
        cb.utils.alert(`当前行营业员“${$$state.get('salesChecked')}”未能在营业员列表中找着`, 'error');
        return $$state;
      }
      if (!checkedEmployee) {
        checkedEmployee = {};
      }
      if (checkedRow) {
        for (const attr in cRefRetId)
          checkedEmployee[attr] = checkedRow[cRefRetId[attr]];
      }
      return $$state.merge({
        salesChecked: checkedRow.name,
        checkedRow: checkedRow
      });
    }
    case 'PLATFORM_UI_BILLING_CLEAR': {
      checkedEmployee = {};
      const defaultSalesClerk = $$state.get('defaultSalesClerk').toJS();
      if (defaultSalesClerk.id) {
        const checkedRow = defaultSalesClerk;
        for (var attr in cRefRetId)
          checkedEmployee[attr] = checkedRow[cRefRetId[attr]];
        return $$state.merge({
          salesChecked: checkedRow.name,
          checkedRow, hasShow: false
        });
      }
      cacheProducts = null;
      okCallBack = null;
      return $$state.merge({
        salesChecked: '',
        checkedRow: {},
        inputValue: '',
        hasShow: false,
        modalVisible: false,
      });
    }
    case 'PLATFORM_UI_BILLING_SALES_CLERK_INIT': {
      const defaultSC = {};
      if (action.payload) {
        for (const attr in action.payload) {
          const attr1 = attr.split('operatorId_')[1];
          defaultSC[attr1] = action.payload[attr];
        }
      }
      return $$state.merge({
        salesChecked: defaultSC.name ? defaultSC.name : '',
        defaultSalesClerk: defaultSC,
      });
    }
    /* mobile */
    /* 参照返回 */
    case 'BILLING_REFER_SALESCLERK_RETURN':/* 营业员-参照返回 */
      return $$state.merge({ checkedRow: action.payload, salesChecked: action.payload.name });
    case 'PLATFORM_UI_BILLING_SALES_SET_CACHEDATE':
      return $$state.merge({ cacheData: action.payload })
    default:
      return $$state;
  }
};

/* 搜索框值改变 */
export function setInputValue (val) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_SALES_CHANGE_INPUT_VALUE', val));
  }
}

/* 获取营业员列表 */
export function getSalesList (likeValue, cacheData) {
  return async function (dispatch, getState) {
    const storeId = getState().user.toJS().storeId;
    const { checkedRow } = getState().salesClerk.toJS();
    const config = {
      url: 'membercenter/bill/getOperatorData',
      method: 'GET',
      params: { iStoreId: storeId, searchText: likeValue || '' }
    };
    const json = cacheData || await proxy(config)
    if (json.code !== 200) {
      cb.utils.alert(json.message, 'error');
    }
    dispatch(genAction('PLATFORM_UI_BILLING_SALES_SET_SALES_LIST', json.data));
    // if (salesChecked == '' || salesChecked == undefined || salesChecked == null)
    if (json.data[0] && (!checkedRow || !checkedRow.id))
      dispatch(genAction('PLATFORM_UI_BILLING_SALES_CHECKED_ROW', json.data[0]));
  }
};
/* 确认 */
export function salesOk () {
  return function (dispatch, getState) {
    const { checkedRow, AfterSaleService_CallBack } = getState().salesClerk.toJS();
    const billingStatus = getState().uretailHeader.toJS().billingStatus;
    if (!checkedRow.id) {
      cb.utils.alert('未选择营业员', 'error');
      return;
    }
    if (!checkedEmployee) {
      checkedEmployee = {};
    }
    for (var attr in cRefRetId)
      checkedEmployee[attr] = checkedRow[cRefRetId[attr]];
    if (AfterSaleService_CallBack) {
      AfterSaleService_CallBack();
    }
    dispatch(genAction('PLATFORM_UI_BILLING_SALES_SET_MODAL_VISIBLE', false));
    dispatch(genAction('PLATFORM_UI_BILLING_SALES_SET_CHECKED', checkedRow.name));
    const { focusedRow, products } = getState().product.toJS();
    if (billingStatus == 'PresellBill' || billingStatus == 'OnlineBill' || billingStatus == 'OnlineBackBill') {
      products.forEach(product => {
        Object.assign(product, checkedEmployee);
        dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', product));
      }, this);
    } else {
      if (focusedRow) {
        Object.assign(focusedRow, checkedEmployee);
        dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', focusedRow));
      }
    }
    if (cacheProducts) {
      dispatch(addCacheProduct(cacheProducts));
      cacheProducts = null;
    }
    if (onlineProducts) {
      const { iMemberid, products, isBack } = onlineProducts;
      dispatch(handleOnlineBill(iMemberid, products, isBack))
      onlineProducts = null
    }
    if (furnitureProducts) {
      dispatch(handleFurnitureBill(furnitureProducts))
      furnitureProducts = null
    }
    /* 选择完营业员的callback */
    if(okCallBack) {
      okCallBack(checkedEmployee);
      okCallBack = null;
    }
  }
};
/* 取消 */
export function salesCancel () {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_SALES_SET_MODAL_VISIBLE', false));
    if (cacheProducts)
      cacheProducts = null;
    okCallBack = null;
  }
};
/* 弹出modal */
export function showSalesClerkModal (callback) {
  return function (dispatch, getState) {
    const { billingStatus } = getState().uretailHeader.toJS();
    if (!canOpenEmplyee(getState())) return;
    if (billingStatus == 'PresellBill' || billingStatus == 'OnlineBill' || billingStatus == 'OnlineBackBill') {
      cb.utils.confirm('将替换所有行营业员，是否继续！', function () {
        dispatch(genAction('PLATFORM_UI_BILLING_SALES_SET_MODAL_VISIBLE', true));
      }, this);
    }
    else {
      dispatch(genAction('PLATFORM_UI_BILLING_SALES_SET_MODAL_VISIBLE', true));
    }
    if (callback) {
      dispatch(genAction('PLATFORM_UI_BILLING_SALES_SET_MODAL_VISIBLE2', callback));
    }
    // else {
    //   dispatch(genAction('PLATFORM_UI_BILLING_SALES_SET_MODAL_VISIBLE2', undefined));
    // }
  }
};
export function canOpenEmplyee (globalState) {
  const { billingStatus, infoData } = globalState.uretailHeader.toJS();
  const focusedRow = globalState.product.toJS().focusedRow;
  if (billingStatus == 'FormerBackBill') {
    if (focusedRow.fQuantity < 0) {
      cb.utils.alert('原单退货中，退货行不允许修改营业员！', 'error')
      return false
    }
    if (focusedRow.noModify) {
      cb.utils.alert('原单退货中，换货行不允许修改营业员！', 'error')
      return false
    }
  }
  if (billingStatus == 'PresellBack') {
    cb.utils.alert('预订退订状态下,不允许修改营业员！', 'error')
    return false
  }
  if (billingStatus == 'Shipment' && !infoData.bDeliveryModify) {
    cb.utils.alert('交货不能修改商品时,不允许修改营业员！', 'error')
    return false
  }
  return true;
}
/* 选中 */
export function checkedRow (row) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_SALES_CHECKED_ROW', row));
  }
};
export function cacheProduct (products) {
  cacheProducts = products;

  return genAction('PLATFORM_UI_BILLING_SALES_SET_COMMON_DATA', { modalVisible: true, hasShow: true });
}

/* 电商弹出营业员参照 */
export function onLineSelectEmployee (iMemberid, products, isBack) {
  onlineProducts = { iMemberid, products, isBack }
  return genAction('PLATFORM_UI_BILLING_SALES_SET_MODAL_VISIBLE', true);
}

export function furnitrueSelectEmployee (products) {
  furnitureProducts = products
  return genAction('PLATFORM_UI_BILLING_SALES_SET_MODAL_VISIBLE', true);
}

export function getCheckedEmployee () {
  return checkedEmployee;
}

/* add by jinzh1 公共弹出营业员方法  支持传callback  选择完营业员调用callback */
export function showEmployeeVtCallBack (callback) {
  okCallBack = callback;
  return genAction('PLATFORM_UI_BILLING_SALES_SET_MODAL_VISIBLE', true);
}
