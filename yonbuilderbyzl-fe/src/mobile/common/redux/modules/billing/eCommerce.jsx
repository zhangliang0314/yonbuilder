
import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { showOperator } from './operator'
// import { Format } from '@mdf/cube/lib/helpers/formatDate';
import { RetailVouchBillNo, handleOnlineBillData } from './mix';

// primaryTableData:[],// 主表数据
// expandedTableData:[],// 嵌套表数据

// let promotionsChildrenField = null;
// let productsChildrenField = null;
let BackBillOriginalData = null; // 原始数据
const mainSelectedKey = null;
// let selectedRowKeys = [];

// let returnMeta = null;

const initialState = {
  visible: false,
  ModalData: {}, // Modal 展示数据
  expandedRowKeys: [],
  searchText: '', // 单据编号
  mainSelectedKey,
  member: '', // 会员 手机号/姓名
  cLogisticsNo: '', // 快递单号(退货专属)
  ladingCode: '', // 提货码
  goodsTab_currentPage: 1,
};

// reducer
export default ($$state = Immutable.fromJS(initialState), action) => {
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_ECOMMERCE_SET_OPTIONS':
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_BILLING_ONLINE_BADGE':
      return $$state.merge({ badge: action.payload})
    case 'PLATFORM_UI_PRODUCT_SET_CHILDREN_FIELD':
      // productsChildrenField = action.payload;
      return $$state;
    case 'PLATFORM_UI_PROMOTION_SET_CHILDREN_FIELD':
      // promotionsChildrenField = action.payload;
      return $$state;
    case 'PLATFORM_UI_BILLING_BACKBILL_SET_MAIN_SELECTED_KEY':
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_BILLING_BACKBILL_SET_PRODUCT_SELECTED_KEYS':
      // selectedRowKeys = action.payload;
      return $$state.set('selectedRowKeys', action.payload.selectedRowKeys)
        .merge({ mainSelectedKey: action.payload.mainSelectedKey });
    case 'PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLEOK':
      console.log('HANDLEOK')
    case 'PLATFORM_UI_BILLING_ECOMMERCE_HANDLE_CANCEL':
      return $$state.set('visible', false)
    case 'PLATFORM_UI_BILLING_BACK_BILL_SET_OPTIONS':
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_BILLING_BACK_BILL_RETURN_META':
      // returnMeta = action.payload;
      return $$state
    case 'PLATFORM_UI_BILLING_ECOMMERCE_CLEAR_REDUX':
      return $$state.merge({
        mainSelectedKey: null,
        selectedRowKeys: [],
        visible: false,
        expandedRowKeys: [],
        goodsTab_currentPage: 1,
        searchText: '',
        member: '',
        cLogisticsNo: '',
        ladingCode: '',
        tihuoWay: undefined,
        dealStatus: undefined,
      })
    case 'PLATFORM_UI_BILLING_ECOMMERCE_RETURN_IMMUTABLE':
      return action.payload.finalState
    default:
      return $$state
  }
}

export function setOptions (value) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_ECOMMERCE_SET_OPTIONS', value))
  }
}

/* 电商订单 */
export function ECommerce (isInit, page, options) {
  return function (dispatch, getState) {
    const { searchText, member, ladingCode, cLogisticsNo, dealStatus, tihuoWay } = options || {};
    const ECRedux = getState().eCommerce;
    const config = {
      url: 'bill/ref/getMallBill',
      method: 'POST',
      params: {
        type: '1', // 1:订单提货 2：电商退货
        vouchcode: searchText || ECRedux.get('searchText') || '', // 单据编号
        member: member || ECRedux.get('member') || '', // 会员 手机号/姓名
        cLogisticsNo: cLogisticsNo || ECRedux.get('cLogisticsNo') || '', // 快递单号(退货专属)
        ladingCode: ladingCode || ECRedux.get('ladingCode') || '', // 提货码
        cCurrentStoreStatus: dealStatus || ECRedux.get('dealStatus') || '', // 订单状态
        cDeliverType: tihuoWay || ECRedux.get('tihuoWay') || '', // 提货方式
        pageSize: 8,
        pageIndex: page || 1,
      }
    }

    proxy(config)
      .then(json => {
        if (json.code === 200) {
          const primaryTableData = [];// 主表数据
          const dataSource = json.data.data;// 接口原始数据
          // let increase = 0;
          if (dataSource != undefined) {
            // 主表
            dataSource.forEach(function (item) {
              // increase += 1;
              const { id, code, dMakeDate, dAppointDate, cAppointTime, iMemberid_cRealName, cReceiveMobile, fQuantity, salereturnLogisticsNo, retailVouchDetails, cCurrentStoreStatus } = item[RetailVouchBillNo];
              primaryTableData.push({
                // key: `back_bill_primary_${increase}`,
                key: id,
                code: code, // 主表单据号
                dMakeDate: dMakeDate, // 主表单据日期
                dAppointDate: cAppointTime ? `${dAppointDate} ${cAppointTime}` : dAppointDate, // 预约日期
                iMemeberId: iMemberid_cRealName, // 会员
                cReceiveMobile: cReceiveMobile, // 联系方式
                fQuantity: fQuantity, // 数量
                salereturnLogisticsNo, // 快递单号 退货才有
                retailVouchDetailsArrary: retailVouchDetails,
                cCurrentStoreStatus: cCurrentStoreStatus // 订单状态
              });
            });
          }; // 'visible', true
          BackBillOriginalData = dataSource;
          /* Menu.jsx 触发 dispatch */
          const goodsTab_totalCount = json.data.totalCount;
          dispatch(genAction('PLATFORM_UI_BILLING_ECOMMERCE_SET_OPTIONS', { visible: true, ModalData: primaryTableData, goodsTab_totalCount: goodsTab_totalCount }));
        } else if (json.code !== 200) {
          cb.utils.alert(json.message, 'error')
        }
      })
  }
}

// Modal 控制
export function backBillModalControl (type) {
  return function (dispatch, getState) {
    const { mainSelectedKey, ModalData } = getState().eCommerce.toJS();
    switch (type) {
      case 'handleOk': {
        if (!mainSelectedKey) {
          cb.utils.alert('请先选择单据', 'error');
          return;
        }
        if (!BackBillOriginalData) return;
        const _index = BackBillOriginalData.findIndex(item => {
          return item[RetailVouchBillNo].id == mainSelectedKey;
        });
        if (_index < 0) return;
        const selectedData = BackBillOriginalData[_index]
        // cb.utils.alert('数据不对，暂无数据导出', 'error')
        // return
        dispatch(genAction('PLATFORM_UI_BILLING_ECOMMERCE_CLEAR_REDUX'))
        // const returnData = JSON.parse(JSON.stringify(selectedData));
        // const returnRetailData = returnData[RetailVouchBillNo];
        // const headerData = dealWithReferReturn(returnMeta.iCoRetailid, returnRetailData) //表头
        // if (selectedRowKeys.length)
        //     headerData[productsChildrenField] = returnRetailData[productsChildrenField].filter(item => {
        //         return selectedRowKeys.indexOf(mainSelectedKey + '_' + item.id) > -1;
        //     });
        // headerData[productsChildrenField].forEach((item, index) => {
        //     headerData[productsChildrenField][index] = dealWithReferReturn(returnMeta.iCoRetailDetailId, item)// 表体
        //     let specArr = [];
        //     for (let attr in item) {
        //         if (attr.startsWith('free') && item[attr])
        //             specArr.push(item[attr])
        //     }
        //     headerData[productsChildrenField][index].specs = specArr.join(',');
        //     headerData[productsChildrenField][index].dCoSaleDate = returnData[RetailVouchBillNo].vouchdate
        //     headerData[productsChildrenField][index].fCanCoQuantity = parseFloat(item.fCanCoQuantity)
        // });
        // returnData[RetailVouchBillNo] = headerData;
        selectedData[RetailVouchBillNo].cCurrentStoreStatus = ModalData[_index].cCurrentStoreStatus
        dealBillBeforeOut(selectedData, (selectedServiceData) => {
          dispatch(handleOnlineBillData(selectedServiceData, selectedServiceData));
        });

        // // 原单退货带入原单是否已经抹零 add by jane
        // dispatch(toggleDelZero(!!Number(_.get(returnRetailData, 'fEffaceMoney'))))

        break;
      }
      case 'handleCancel':
        dispatch(genAction('PLATFORM_UI_BILLING_ECOMMERCE_HANDLE_CANCEL'));
        dispatch(genAction('PLATFORM_UI_BILLING_ECOMMERCE_CLEAR_REDUX'));
        break;
      default:
        break;
    }
  }
}

/* 导出数据前从新构建数据 */
export function dealBillBeforeOut (data, callback) {
  const config = {
    url: 'thirdparty/mall/getorderinfo',
    method: 'POST',
    params: { data }
  }
  proxy(config).then(json => {
    if(json.code !== 200) {
      cb.utils.alert(json.message, 'error');
      return null
    }
    callback(JSON.parse(json.data))
  });
}

/* 获取徽标 */
export function initBadge () {
  return function (dispatch, getState) {
    // let offlineLogin = cb.rest.AppContext.token
    const lineConnection = getState().offLine.get('lineConnection');
    if (!lineConnection) return
    const config = {
      url: 'bill/ref/getMallBill',
      method: 'POST',
      params: {
        type: '1', // 1:订单提货 2：电商退货
        pageSize: 1,
        pageIndex: 1,
      }
    }
    proxy(config).then(json => {
      if(json.code !== 200) return
      const badge = (json.data && json.data.data && json.data.data.length) || 0;
      dispatch(genAction('PLATFORM_UI_BILLING_ONLINE_BADGE', badge));
    })
  }
}

/* 选中数据 */
export function setMainSelectedKey (value) {
  return (genAction('PLATFORM_UI_BILLING_ECOMMERCE_SET_OPTIONS', {mainSelectedKey: value}));
}

export function canOpen (type, isHasAuth, callback) {
  return function (dispatch) {
    const mapping = {
      FormerBackBill: { authType: 'backbill', authCode: 'RM05' },
      NoFormerBackBill: { authType: 'returnproduct', authCode: 'RM06' }
    }
    if (!isHasAuth) {
      dispatch(showOperator(true, false, mapping[type].authType, mapping[type].authCode, callback));
    } else {
      callback();
    }
  }
}

/* 接单 拒单 */
export function changeECommerceStatus (status) {
  return function (dispatch, getState) {
    const eCommerceState = getState().eCommerce;
    const mainSelectedKey = eCommerceState.get('mainSelectedKey');
    if(!mainSelectedKey) {
      cb.utils.alert('请选择商城订单！', 'error')
      return
    }
    const ModalData = eCommerceState.get('ModalData');
    let rowIndex = '';
    const row = ModalData.find((value, index, immutalbe) => {
      if(value.get('key') == mainSelectedKey) {
        rowIndex = index
        return value
      }
    })
    const cCurrentStoreStatus = row.get('cCurrentStoreStatus');
    const config = {
      url: 'bill/ref/handleRefMallBill',
      method: 'POST',
      params: {
        handleStatus: status === 'accept' ? 0 : 1,
        cOrderNo: row.get('code'),
        cCurrentStoreStatus: cCurrentStoreStatus || null
      }
    }
    proxy(config).then(json => {
      if(json.code !== 200) {
        cb.utils.alert(json.message, 'error');
        return
      }
      const cCurrentStoreStatus = json.data && json.data.cCurrentStoreStatus;
      const finalState = eCommerceState.updateIn(['ModalData', rowIndex], val => {
        return val.set('cCurrentStoreStatus', cCurrentStoreStatus)
      })
      dispatch(genAction('PLATFORM_UI_BILLING_ECOMMERCE_RETURN_IMMUTABLE', {finalState}))
    })
  }
}
