/**
 * Billing 开单 -> 交货
 */
import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { RetailVouchBillNo, handleBackBillData } from './mix';

// primaryTableData:[],// 主表数据
// expandedTableData:[],// 嵌套表数据

let productsChildrenField = null;
let BackBillOriginalData = null; // 原始数据
let mainSelectedKey = null;
let selectedRowKeys = [];

const $$initialState = Immutable.fromJS({
  BackBillData: {}, // Modal 展示数据
  mainSelectedKey,
  selectedRowKeys, // sku选中的行的key集合  clear
  visible: false, // 显示 Modal ，visible -> true
  confirmLoading: false,
  columnsMain: [],
  columnsNest: [],
});

// Reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    // 退货
    case 'PLATFORM_UI_BILLING_BACK_BILL':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_PRODUCT_SET_CHILDREN_FIELD':
      productsChildrenField = action.payload;
      return $$state;
    case 'PLATFORM_UI_BILLING_BACKBILL_SET_MAIN_SELECTED_KEY':
      mainSelectedKey = action.payload;
      selectedRowKeys = [];
      return $$state.set('mainSelectedKey', mainSelectedKey)
        .set('selectedRowKeys', selectedRowKeys);
    case 'PLATFORM_UI_BILLING_BACKBILL_SET_PRODUCT_SELECTED_KEYS':
      selectedRowKeys = action.payload;
      return $$state.set('selectedRowKeys', selectedRowKeys);
    case 'PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLEOK':
      console.log('HANDLEOK')
    case 'PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLE_CANCEL':
      return $$state.set('visible', false)
    default:
      return $$state;
  }
}

// 退订
export function deliver () {
  return function (dispatch, getState) {
    const config = {
      url: '/bill/ref/getReserveBill',
      method: 'POST',
      params: {
        // 参数暂时为空
      }
    }

    proxy(config)
      .then(json => {
        if (json.code === 200) {
          const primaryTableData = [];// 主表数据
          const dataSource = json.data;// 接口原始数据
          // let increase = 0;
          if (dataSource != undefined) {
            // 主表
            dataSource.forEach(function (item) {
              // increase += 1;
              const { id, code, createTime, cStoreCode, fMoneySum, retailVouchDetails } = item[RetailVouchBillNo];
              primaryTableData.push({
                // key: `back_bill_primary_${increase}`,
                key: id,
                billsCode: code, // 主表单据号
                billsDate: createTime, // 主表单据日期
                memberName: '张晓梅', // 主表会员名称
                points: cStoreCode, // 主表本单积分
                totalQuantity: 18, // 主表数量合计
                totalPrice: fMoneySum, // 主表实销金额
                retailVouchDetailsArrary: retailVouchDetails
              });
            });
          }; // 'visible', true
          BackBillOriginalData = dataSource;
          /* Menu.jsx 触发 dispatch */
          dispatch(genAction('PLATFORM_UI_BILLING_BACK_BILL', { BackBillData: primaryTableData, visible: true }));
        } else if (json.code !== 200) {
          // message.loading(json.message, 3);
        }
      })
  }
}

// Modal 控制
export function unsubscribeModalControl (type) {
  return function (dispatch) {
    switch (type) {
      case 'handleOk': {
        dispatch(genAction('PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLEOK'));
        if (!BackBillOriginalData) return;
        const selectedData = BackBillOriginalData.find(item => {
          return item[RetailVouchBillNo].id === mainSelectedKey;
        });
        if (!selectedData) return;
        const returnData = Object.assign(true, {}, selectedData);
        if (selectedRowKeys.length)
          returnData[RetailVouchBillNo][productsChildrenField] = selectedData[RetailVouchBillNo][productsChildrenField].filter(item => {
            return selectedRowKeys.indexOf(mainSelectedKey + '_' + item.id) > -1;
          });
        dispatch(handleBackBillData(returnData, selectedData));
        break;
      }
      case 'handleCancel':
        dispatch(genAction('PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLE_CANCEL'));
        break;
      default:
        break;
    }
  }
}
