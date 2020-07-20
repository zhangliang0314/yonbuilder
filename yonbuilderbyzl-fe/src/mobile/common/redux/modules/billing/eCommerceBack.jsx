
import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { showOperator } from './operator'
// import { Format } from '@mdf/cube/lib/helpers/formatDate';
import { RetailVouchBillNo, handleOnlineBillData } from './mix';
import { dealBillBeforeOut } from './eCommerce'

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
  mainSelectedKey,
  searchText: '', // 单据编号
  member: '', // 会员 手机号/姓名
  cLogisticsNo: '', // 快递单号(退货专属)
  ladingCode: '', // 提货码
  goodsTab_currentPage: 1,
};

// reducer
export default ($$state = Immutable.fromJS(initialState), action) => {
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_ECOMMERCE_BACK_SET_OPTIONS':
      return $$state.merge(action.payload)
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
    case 'PLATFORM_UI_BILLING_ECOMMERCE_BACK_HANDLE_CANCEL':
      return $$state.set('visible', false)
    case 'PLATFORM_UI_BILLING_BACK_BILL_SET_OPTIONS':
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_BILLING_BACK_BILL_RETURN_META':
      // returnMeta = action.payload;
      return $$state
    case 'PLATFORM_UI_BILLING_ECOMMERCE_BACK_CLEAR_REDUX':
      return $$state.merge({
        mainSelectedKey: null,
        selectedRowKeys: [],
        visible: false,
        expandedRowKeys: [],
        goodsTab_currentPage: 1,
        searchText: '',
        member: '',
        cLogisticsNo: '',
        ladingCode: ''
      })
    default:
      return $$state
  }
}

export function setOptions (value) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_ECOMMERCE_BACK_SET_OPTIONS', value))
  }
}

/* 电商订单 */
export function ECommerceBack (isInit, page, options) {
  return function (dispatch, getState) {
    const { searchText, member, ladingCode, cLogisticsNo } = options || {};
    const config = {
      url: 'bill/ref/getMallBill',
      method: 'POST',
      params: {
        type: '2', // 1:订单提货 2：电商退货
        vouchcode: searchText || '', // 单据编号
        member: member || '', // 会员 手机号/姓名
        cLogisticsNo: cLogisticsNo || '', // 快递单号(退货专属)
        ladingCode: ladingCode || '', // 提货码
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
              const { id, code, iCoRetailCode, dMakeDate, dAppointDate, iMemberid_cRealName, cReceiveMobile, fQuantity, salereturnLogisticsNo, retailVouchDetails } = item[RetailVouchBillNo];
              primaryTableData.push({
                // key: `back_bill_primary_${increase}`,
                key: id,
                code: code, // 主表单据号
                dMakeDate: dMakeDate, // 主表单据日期
                dAppointDate: dAppointDate, // 预约日期
                iMemeberId: iMemberid_cRealName, // 会员
                cReceiveMobile: cReceiveMobile, // 联系方式
                fQuantity: fQuantity, // 数量
                iCoRetailCode, // 原单号 退货才有
                salereturnLogisticsNo, // 快递单号 退货才有
                retailVouchDetailsArrary: retailVouchDetails
              });
            });
          }; // 'visible', true
          BackBillOriginalData = dataSource;
          /* Menu.jsx 触发 dispatch */
          const goodsTab_totalCount = json.data.totalCount;
          dispatch(genAction('PLATFORM_UI_BILLING_ECOMMERCE_BACK_SET_OPTIONS', { visible: true, ModalData: primaryTableData, goodsTab_totalCount: goodsTab_totalCount }));
        } else if (json.code !== 200) {
          cb.utils.alert(json.message, 'error')
        }
      })
  }
}

// Modal 控制
export function backBillModalControl (type) {
  return function (dispatch, getState) {
    const mainSelectedKey = getState().eCommerceBack.toJS().mainSelectedKey;
    switch (type) {
      case 'handleOk': {
        if (!mainSelectedKey) {
          cb.utils.alert('请先选择单据', 'error');
          return;
        }
        if (!BackBillOriginalData) return;
        const selectedData = BackBillOriginalData.find(item => {
          return item[RetailVouchBillNo].id == mainSelectedKey;
        });
        if (!selectedData) return;
        // cb.utils.alert('数据不对，暂无数据导出', 'error')
        // return
        dispatch(genAction('PLATFORM_UI_BILLING_ECOMMERCE_BACK_CLEAR_REDUX'))
        const returnData = JSON.parse(JSON.stringify(selectedData));
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
        // dispatch(handleOnlineBillData(returnData, selectedData, true));
        dealBillBeforeOut(selectedData, (selectedServiceData) => {
          dispatch(handleOnlineBillData(selectedServiceData, returnData, true));
        });

        // // 原单退货带入原单是否已经抹零 add by jane
        // dispatch(toggleDelZero(!!Number(_.get(returnRetailData, 'fEffaceMoney'))))

        break;
      }
      case 'handleCancel':
        dispatch(genAction('PLATFORM_UI_BILLING_ECOMMERCE_BACK_HANDLE_CANCEL'));
        dispatch(genAction('PLATFORM_UI_BILLING_ECOMMERCE_BACK_CLEAR_REDUX'));
        break;
      default:
        break;
    }
  }
}

// const dealWithReferReturn = (meta, data) => {
//     let dataSource = {};
//     //"product_productSkuProps!define@1@@60"
//     for (let i = 0, len = meta.length; i < len; i++) {
//         let ele = meta[i];
//         let eleMeta = ele.split(':');
//         let mapValue = '', mapKey = '';
//         mapKey = eleMeta[0];
//         mapValue = eleMeta[1] ? eleMeta[1] : eleMeta[0]
//         if (ele.indexOf('@') > -1) {
//             let keyIndex = mapKey.indexOf('@');
//             let valueIndex = mapValue.indexOf('@');
//             let start = parseInt(ele.substring(keyIndex + 1, keyIndex + 2));
//             let end = parseInt(ele.substring(ele.indexOf('@@') + 2))
//             if (mapValue == mapKey) {
//                 let sameAttr = ele.substring(0, keyIndex);
//                 for (let j = start; j <= end; j++) {
//                     dataSource[`${sameAttr}${j}`] = data[`${sameAttr}${j}`]
//                 }
//             } else {
//                 let keyAttr = mapKey.substring(0, keyIndex);
//                 let valueAttr = mapValue.substring(0, valueIndex);
//                 for (let j = start; j <= end; j++) {
//                     dataSource[`${keyAttr}${i}`] = data[`${valueAttr}${i}`]
//                 }
//             }
//         } else {
//             dataSource[mapKey] = data[mapValue]
//         }
//     }
//     return dataSource
// }

/* 选中数据 */
export function setMainSelectedKey (value) {
  return (genAction('PLATFORM_UI_BILLING_ECOMMERCE_BACK_SET_OPTIONS', {mainSelectedKey: value}));
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
