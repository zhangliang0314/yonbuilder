/**
 * Billing 开单 -> 挂单/解挂
 */
import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { getRetailVoucherData, clear, handlePendingData, getMallorderInfo } from './mix';
import { setReceiptHang } from './menu';
import { print } from './receiptPrinter';
import { getBillingViewModel } from './config';
import moment from 'moment';

// primaryTableData:[],// 主表数据
// expandedTableData:[],// 嵌套表数据

let productsChildrenField = null;
// let gatheringChildrenField = null;
let PendingOriginalData = null; // 原始数据
let mainSelectedKey = null;
let cacheMainSelectedKey = null;// 缓存选择的单据，挂单提交数据时使用
let selectedRowKeys = [];

const $$initialState = Immutable.fromJS({
  pendingData: [], // 需要挂起的数据
  pendingOrderState: false, // 挂单成功 -> true
  visible: false, // 解挂时显示 Modal，visible -> true
  confirmLoading: false,
  goodsTab_totalCount: null, // 解挂模态 → 搜索 → 总数据量 clear
  goodsTab_currentPage: 1, // 解挂模态 → 搜索 → 当前页码 clear
  inputValue: null, // 解挂模态 → 搜索 → 关键字
  loading: true, // 解挂模态 → 列表 → 页面加载中
  pageSize: 8, // 解挂模态 → 列表 → 每页条数
  columnsMain: [],
  columnsNest: [],
  operators: [],
  mainSelectedKey,
  cacheMainSelectedKey,
  selectedRowKeys, // sku选中的行的key集合  clear
  pending_cacheData: null, /* 登录缓存操作员数据 */
});

// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_PRODUCT_SET_CHILDREN_FIELD':
      productsChildrenField = action.payload;
      return $$state;
    case 'PLATFORM_UI_GATHERING_SET_CHILDREN_FIELD':
      // gatheringChildrenField = action.payload;
      return $$state;
    // 挂单
    case 'PLATFORM_UI_BILLING_PENDING_ORDER':
      return $$state.set('pendingOrderState', true)
        .set('mainSelectedKey', null);
    // 解单
    case 'PLATFORM_UI_BILLING_QUERY_PENDING_ORDER':
      return $$state.merge(action.payload)
        .set('visible', true)
        .set('loading', false)
    // 删单
    case 'PLATFORM_UI_BILLING_DELETE_PENDING_ORDER':
      return $$state.set('pendingData', action.payload)
    case 'PLATFORM_UI_BILLING_PENDING_SET_MAIN_SELECTED_KEY':
      mainSelectedKey = action.payload;
      cacheMainSelectedKey = action.payload;
      selectedRowKeys = [];
      return $$state.set('mainSelectedKey', mainSelectedKey)
        .set('cacheMainSelectedKey', cacheMainSelectedKey)
        .set('selectedRowKeys', selectedRowKeys);
    case 'PLATFORM_UI_BILLING_PENDING_SET_PRODUCT_SELECTED_KEYS':
      selectedRowKeys = action.payload;
      return $$state.set('selectedRowKeys', selectedRowKeys);

    case 'PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLEOK':
      return $$state.set('visible', false)
    case 'PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLE_CANCEL':
      return $$state.set('visible', false)
    case 'PLATFORM_UI_BILLING_PENDING_SET_OPERATORS':
      return $$state.merge({ operators: action.payload });
    case 'PLATFORM_UI_BILLING_CANCEL_PENDING_CLEAR_REDUX':
      return $$state.merge({
        mainSelectedKey: null,
        selectedRowKeys: [],
        visible: false,
        goodsTab_currentPage: 1,
      })
    case 'PLATFORM_UI_BILLING_CLEAR':
      mainSelectedKey = null;
      cacheMainSelectedKey = null;
      selectedRowKeys = [];
      return $$state.set('mainSelectedKey', mainSelectedKey)
        .set('cacheMainSelectedKey', cacheMainSelectedKey)
        .set('selectedRowKeys', selectedRowKeys);
    case 'PLATFORM_UI_BILLING_PENDING_LOGIN_CACHE_DATA':
      return $$state.merge({ pending_cacheData: action.payload})
    default:
      return $$state;
  }
}

/***
 *** 单据挂单服务： billingretail/hang
 *** 单据解挂服务： billingretail/hook
 *** 单据删除服务： billingretail/del
 */

// 挂单
export function pendingOrder (needPrint) {
  return function (dispatch, getState) {
    const data = getRetailVoucherData(getState(), true);
    data.vouchdate = moment().format('YYYY-MM-DD HH:mm:ss');
    if (data.iMemberid) {
      const memberRedux = getState().member.toJS();
      data.iMemberid_name = memberRedux.realname;
    }
    const productRedux = getState().product.toJS();
    const userRedux = getState().user.toJS();
    const cancelPendingRedux = getState().cancelPending.toJS();
    const mallorderInfo = getMallorderInfo();
    const params = {
      code: cancelPendingRedux.cacheMainSelectedKey, // 单据号（服务端生成），缓存数据避免清空操作为Null
      createTime: '', // 创建时间（服务端生成）
      totalQuantity: productRedux.money.TotalQuantity.value, // 总计商品数量
      totalPrice: productRedux.money.Real.value.toFixed(2), // 总实销金额
      pendingCreator: userRedux.name, // 单据创建者，当前收银员name
      pendingCode: userRedux.code, // 单据创建者，当前收银员code
      // memberMid: memberRedux.memberInfo.data.mid, // 会员 mid 信息
      store_name: data.store_name, // 门店
      shift: userRedux.defaultGradeName, // 班次
      productList: data[productsChildrenField] || productRedux.products, // 商品列表里的全部商品信息
      data,
      mallorderInfo
    };
    if (!beforePending(params)) return
    const proxy = cb.rest.DynamicProxy.create({ hangBill: { url: 'billingretail/hang', method: 'POST', options: { async: false } } });
    const hangResult = proxy.hangBill(params);
    if (hangResult.error) {
      cb.utils.alert(hangResult.error.message, 'error');
      return;
    }
    dispatch(genAction('PLATFORM_UI_BILLING_PENDING_ORDER', { code: 200, data: hangResult.result }));
    if (needPrint) {
      const canPrint = getState().config.toJS().canPrint;
      if (canPrint)
        dispatch(print(hangResult.result));
      else
        cb.utils.alert('当前状态不允许打小票', 'error');
    }
    dispatch(clear(false));
    cb.utils.alert(`挂单成功:${hangResult.result}`, 'success');

    // const config = {
    //   url: 'billingretail/hang',
    //   method: 'POST',
    //   params: params,
    // }
    // console.log('挂单提交的参数：', params)
    // proxy(config)
    //   .then(json => {
    //     if (json.code === 200) {
    //       dispatch(genAction('PLATFORM_UI_BILLING_PENDING_ORDER', json));
    //       if (needPrint) {
    //         const canPrint = getState().config.toJS().canPrint;
    //         if (canPrint)
    //           dispatch(print(json.data));
    //         else
    //           cb.utils.alert(`当前状态不允许打小票`, 'error');
    //       }
    //       dispatch(clear(false));
    //       cb.utils.alert('挂单成功', 'success');
    //     } else if (json.code !== 200) {
    //       cb.utils.alert(json.message, 'error');
    //     }
    //   })
  }
}

// 解除挂单 获取挂单数据
export function queryPendingOrder (multiple, operator, isInit) {
  return function (dispatch, getState) {
    const defaultCode = getState().user.toJS().code
    const config = arguments.length === 0 ? {
      url: 'billingretail/hook',
      method: 'POST',
      params: {}
    } : {
      url: 'billingretail/querybilling',
      method: 'POST',
      params: {
        multiple: multiple,
        operator: isInit ? defaultCode : operator,
      }
    }
    proxy(config)
      .then(json => {
        if (json.code === 200) {
          PendingOriginalData = json.data;
          const goodsTab_totalCount = json.data.length;
          dispatch(genAction('PLATFORM_UI_BILLING_QUERY_PENDING_ORDER', { pendingData: json, goodsTab_totalCount: goodsTab_totalCount }));
        }
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
        }
      });
  }
}

// 删单
export function deletePendingOrder (orderCodeNumber) {
  return function (dispatch) {
    orderCodeNumber = orderCodeNumber || mainSelectedKey;
    const config = {
      url: 'billingretail/del',
      method: 'POST',
      params: {
        code: orderCodeNumber // 单据号
      }
    }
    proxy(config)
      .then(json => {
        if (json.code === 200) {
          dispatch(genAction('PLATFORM_UI_BILLING_DELETE_PENDING_ORDER', json));
          if (orderCodeNumber === mainSelectedKey)
            dispatch(setMainSelectedKey(null));
        }
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
        }
      });
  }
}

// 解挂 Modal 控制
export function cancelPendingModalControl (type) {
  return function (dispatch) {
    switch (type) {
      case 'handleOk': {
        dispatch(genAction('PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLEOK'));
        if (!PendingOriginalData) return;
        const selectedData = PendingOriginalData.find(item => {
          return item.code === mainSelectedKey;
        });
        if (!selectedData) return;
        dispatch(handlePendingData(selectedData));
        dispatch(setReceiptHang(false));
        dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PENDING_CLEAR_REDUX'));// 清空模态状态
        break;
      }
      case 'handleCancel':
        dispatch(genAction('PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLE_CANCEL'));
        dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PENDING_CLEAR_REDUX'));// 清空模态状态
        break;
      default:
        break;
    }
  }
}

// visible: false,
// confirmLoading: true,
// billingretail/del 删除

export function setMainSelectedKey (value) {
  return genAction('PLATFORM_UI_BILLING_PENDING_SET_MAIN_SELECTED_KEY', value);
}

export function setProductSelectedKeys (value) {
  return genAction('PLATFORM_UI_BILLING_PENDING_SET_PRODUCT_SELECTED_KEYS', value);
}

export function execute (needPrint) {
  return function (dispatch, getState) {
    const isReceiptHang = getState().menu.toJS().isReceiptHang;
    const uretailHeader = getState().uretailHeader.toJS();
    console.log('uretailHeader.billingStatus 开单状态 → ', uretailHeader.billingStatus)
    const billingStatus = uretailHeader.billingStatus === 'FormerBackBill' || uretailHeader.billingStatus === 'Shipment' || uretailHeader.billingStatus === 'PresellBack' || uretailHeader.infoData.bRepair === true;// 原单退货、订货交货/预定状态、补单
    const billingStatusName = (key) => {
      switch (key) {
        case 'Shipment': return '交货'
        case 'PresellBack': return '预定'
        case 'FormerBackBill': return '原单退货'
        case 'CashSale': return '补单'
        default: return '此'
      }
    }
    billingStatus ? cb.utils.alert(`${billingStatusName(uretailHeader.billingStatus)}状态下，不能挂单！`, 'error') : dispatch(isReceiptHang ? queryPendingOrder(null, null, true) : pendingOrder(needPrint));// 解挂 or 挂单
  }
}

export function getOperators (cacheData) {
  return async function (dispatch, getState) {
    const storeId = getState().user.toJS().storeId;
    const config = {
      url: 'user/getUserListByStoreid',
      method: 'POST',
      params: { storeid: storeId }
    };
    const json = cacheData || await proxy(config)
    if (json.code !== 200) {
      cb.utils.alert(json.message, 'error');
      return;
    }
    dispatch(genAction('PLATFORM_UI_BILLING_PENDING_SET_OPERATORS', json.data));
  }
}

const beforePending = (params) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforePending', {params})
}
