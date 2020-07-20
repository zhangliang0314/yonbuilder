/**
 * Billing 开单 -> 原单退货
 */
import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { Format } from '@mdf/cube/lib/helpers/formatDate';
import { showOperator } from './operator'
import { RetailVouchBillNo, GatheringVouchBillNo, handleBackBillData } from './mix';
import { push } from 'react-router-redux'
import { toggleDelZero } from './paymode';
import { getBillingViewModel } from './config';
import _ from 'lodash';

// primaryTableData:[],// 主表数据
// expandedTableData:[],// 嵌套表数据

let promotionsChildrenField = null;
let productsChildrenField = null;
let BackBillOriginalData = null; // 原始数据
let mainSelectedKey = null;
// let selectedRowKeys = [];

let returnMeta = null;

const $$initialState = Immutable.fromJS({
  ModalData: {}, // Modal 展示数据
  CacelModalData: [], // 缓存所有的退货数据
  expandedRowKeys: [],
  searchText: '',
  startTime: '',
  endTime: '',
  batchNo: '',
  phone: '',
  mainSelectedKey,
  selectedRowKeys: [], // sku选中的行的key集合  clear
  visible: false, // 显示 Modal ，visible -> true
  confirmLoading: false,
  goodsTab_totalCount: null, // 退货模态 → 搜索 → 总数据量 clear
  goodsTab_currentPage: 1, // 退货模态 → 搜索 → 当前页码 clear
  inputValue: null, // 退货模态 → 搜索 → 关键字
  loading: true, // 退货模态 → 列表 → 页面加载中
  pageSize: 8, // 退货模态 → 列表 → 每页条数
  columnsMain: [],
  columnsNest: [],
});

// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    // 退货
    case 'PLATFORM_UI_BILLING_BACK_BILL':
      return $$state.merge(action.payload)
        .set('visible', true)
        .set('loading', false)
    case 'PLATFORM_UI_PRODUCT_SET_CHILDREN_FIELD':
      productsChildrenField = action.payload;
      return $$state;
    case 'PLATFORM_UI_PROMOTION_SET_CHILDREN_FIELD':
      promotionsChildrenField = action.payload;
      return $$state;
    case 'PLATFORM_UI_BILLING_BACKBILL_SET_MAIN_SELECTED_KEY':
      mainSelectedKey = action.payload.mainSelectedKey;
      // selectedRowKeys = [];
      return $$state.merge({ mainSelectedKey: mainSelectedKey })
        .set('selectedRowKeys', action.payload.selectedRowKeys);
    case 'PLATFORM_UI_BILLING_BACKBILL_SET_PRODUCT_SELECTED_KEYS':
      // selectedRowKeys = action.payload;
      return $$state.set('selectedRowKeys', action.payload.selectedRowKeys)
        .merge({ mainSelectedKey: action.payload.mainSelectedKey });
    case 'PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLEOK':
      console.log('HANDLEOK')
    case 'PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLE_CANCEL':
      return $$state.set('visible', false)
    case 'PLATFORM_UI_BILLING_BACK_BILL_SET_OPTIONS':
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_BILLING_BACK_BILL_RETURN_META':
      returnMeta = action.payload;
      return $$state
    case 'PLATFORM_UI_BILLING_BACKBILL_CLEAR_REDUX':
      return $$state.merge({
        mainSelectedKey: null,
        selectedRowKeys: [],
        visible: false,
        expandedRowKeys: [],
        goodsTab_currentPage: 1,
        searchText: '',
        startTime: '',
        endTime: '',
        batchNo: '',
        phone: ''
      })

    /* mobile */
    case 'PLATFORM_UI_BILLING_DATASOURCE_REMOVE_CODE':
      BackBillOriginalData = null;
      return $$state.merge({
        ModalData: [],
        CacelModalData: [],
        goodsTab_currentPage: 1,
        startTime: '',
        endTime: '',
        batchNo: '',
        phone: ''
      })
    default:
      return $$state;
  }
}

export function setOptions (value) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_BACK_BILL_SET_OPTIONS', value))
  }
}

// 原单退货
export function backBill (batchNo, phone, searchText, pageIndex, pageSize, isInit, callback) {
  return function (dispatch, getState) {
    let { startTime, endTime, CacelModalData } = getState().backBill.toJS();
    let start = startTime; let end = endTime;
    if (isInit && !startTime && !endTime) {
      end = Format(new Date(), 'yyyy-MM-dd');
      start = Format(new Date(), 'yyyy-MM');
      start = `${start}-01`;
      dispatch(genAction('PLATFORM_UI_BILLING_BACK_BILL_SET_OPTIONS', { startTime: start, endTime: end }));
    }
    const config = {
      url: '/bill/ref/getRetailVouchForReturn',
      method: 'POST',
      params: {
        product: batchNo,
        member: phone,
        vouchcode: searchText || '',
        begindate: start || startTime,
        enddate: end || endTime,
        pageSize: pageSize || 8,
        pageIndex: pageIndex || 1,
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
              const { id, code, vouchdate, fPointCurrent, fMoneySum, retailVouchDetails, iMemberid_name, fQuantitySum, iBusinesstypeid_name, avatar, fPointBalance, fPointPayMoney, fPointPay, room_code } = item[RetailVouchBillNo];
              primaryTableData.push({
                // key: `back_bill_primary_${increase}`,
                key: id,
                billsCode: code, // 主表单据号
                billsDate: vouchdate, // 主表单据日期
                memberName: iMemberid_name, // 主表会员名称
                points: fPointCurrent, // 主表本单积分
                totalQuantity: fQuantitySum, // 主表数量合计
                totalPrice: fMoneySum, // 主表实销金额
                retailVouchDetailsArrary: retailVouchDetails,
                /* add by jinzh1  移动端需要数据 */
                avatar, fPointBalance,
                fPointPayMoney, iBusinesstypeid_name,
                fPointPay,
                room_code,
                gatheringVouchDetail: item[GatheringVouchBillNo].gatheringVouchDetail
              });
            });
          }; // 'visible', true
          /* Menu.jsx 触发 dispatch */
          const goodsTab_totalCount = json.data.totalCount;
          /* mobile */
          if (cb.rest.terminalType == 3) {
            if (!BackBillOriginalData) {
              BackBillOriginalData = dataSource;
            } else {
              BackBillOriginalData = _.unionWith(BackBillOriginalData, dataSource, (ob, od) => {
                return ob.rm_retailvouch.id === od.rm_retailvouch.id;
              });
            }
            CacelModalData = _.unionWith(CacelModalData, primaryTableData, (ob, od) => {
              return ob.key === od.key;
            });
            CacelModalData = _.sortBy(CacelModalData, (obj) => {
              return -new Date(obj.billsDate).getTime();
            })
            if (callback)
              callback(primaryTableData, goodsTab_totalCount);
          } else {
            BackBillOriginalData = dataSource;
          }

          dispatch(genAction('PLATFORM_UI_BILLING_BACK_BILL', { ModalData: primaryTableData, goodsTab_totalCount: goodsTab_totalCount, CacelModalData, searchText, phone, batchNo, pageSize, goodsTab_currentPage: pageIndex }));
        } else if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
        }
      })
  }
}

// Modal 控制
export function backBillModalControl (type) {
  return function (dispatch, getState) {
    const selectedRowKeys = getState().backBill.toJS().selectedRowKeys;
    const mainSelectedKey = getState().backBill.toJS().mainSelectedKey;
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
        if (!canExport(selectedData, selectedRowKeys)) return;
        if (cb.rest.terminalType == 3) dispatch(push('/billing'));
        // dispatch(genAction('PLATFORM_UI_BILLING_BACKBILL_CLEAR_REDUX'))
        const returnData = JSON.parse(JSON.stringify(selectedData));
        const returnRetailData = returnData[RetailVouchBillNo];
        const headerData = dealWithReferReturn(returnMeta.iCoRetailid, returnRetailData) // 表头
        headerData.formBackUnreceivable = parseFloat(returnRetailData.fMoneySum - returnRetailData.fPresellPayMoney) // 原单未收款金额，赵哲映射里没有
        // const bodyData = dealWithReferReturn(returnMeta.iCoRetailDetailId, returnData[RetailVouchBillNo][productsChildrenField])// 表体
        // returnRetailData.iCoRetailid = returnRetailData.id;
        // delete returnRetailData.id;
        if (selectedRowKeys.length)
          headerData[productsChildrenField] = returnRetailData[productsChildrenField].filter(item => {
            return selectedRowKeys.indexOf(mainSelectedKey + '_' + item.id) > -1;
          });
        headerData[productsChildrenField].forEach((item, index) => {
          // item.fDiscount = 0;
          // item.fQuotePrice = item.fPrice;
          // item.fQuoteMoney = item.fQuotePrice * parseFloat(item.fCanCoQuantity);
          /* oldid替换id 张林 */
          const oldid = headerData[productsChildrenField][index].oldid
          if (oldid) headerData[productsChildrenField][index].id = oldid
          headerData[productsChildrenField][index] = dealWithReferReturn(returnMeta.iCoRetailDetailId, item)// 表体
          // item.iCoRetailDetailId = item.id;
          // // delete item.id;
          const specArr = [];
          for (const attr in item) {
            if (attr.startsWith('free') && item[attr])
              specArr.push(item[attr])
          }
          headerData[productsChildrenField][index].specs = specArr.join(',');
          headerData[productsChildrenField][index].dCoSaleDate = returnData[RetailVouchBillNo].vouchdate
          headerData[productsChildrenField][index].fCanCoQuantity = parseFloat(item.fCanCoQuantity)
          headerData[productsChildrenField][index].productAlbums = item.productAlbums;
        });
        returnData[RetailVouchBillNo] = headerData;
        if (!beforeBackBill(returnData, selectedData)) return
        dispatch(genAction('PLATFORM_UI_BILLING_BACKBILL_CLEAR_REDUX'))
        dispatch(handleBackBillData(returnData, selectedData));

        // 原单退货带入原单是否已经抹零 add by jane
        dispatch(toggleDelZero(!!Number(_.get(returnRetailData, 'fEffaceMoney'))))

        break;
      }
      case 'handleCancel':
        dispatch(genAction('PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLE_CANCEL'));
        dispatch(genAction('PLATFORM_UI_BILLING_BACKBILL_CLEAR_REDUX'));
        break;
      default:
        break;
    }
  }
}

const dealWithReferReturn = (meta, data) => {
  const dataSource = {};
  // "product_productSkuProps!define@1@@60"
  for (let i = 0, len = meta.length; i < len; i++) {
    const ele = meta[i];
    const eleMeta = ele.split(':');
    let mapValue = ''; let mapKey = '';
    mapKey = eleMeta[0];
    mapValue = eleMeta[1] ? eleMeta[1] : eleMeta[0]
    if (ele.indexOf('@') > -1) {
      const keyIndex = mapKey.indexOf('@');
      const valueIndex = mapValue.indexOf('@');
      const start = parseInt(ele.substring(keyIndex + 1, keyIndex + 2));
      const end = parseInt(ele.substring(ele.indexOf('@@') + 2))
      if (mapValue == mapKey) {
        const sameAttr = ele.substring(0, keyIndex);
        for (let j = start; j <= end; j++) {
          dataSource[`${sameAttr}${j}`] = data[`${sameAttr}${j}`]
        }
      } else {
        const keyAttr = mapKey.substring(0, keyIndex);
        const valueAttr = mapValue.substring(0, valueIndex);
        for (let j = start; j <= end; j++) {
          dataSource[`${keyAttr}${i}`] = data[`${valueAttr}${i}`]
        }
      }
    } else {
      dataSource[mapKey] = data[mapValue]
    }
  }
  return dataSource
}

const canExport = (selectedData, selectedRowKeys) => {
  let canPass = true;
  const backBillData = selectedData[RetailVouchBillNo][productsChildrenField];
  let originCount = 0; let currentCount = 0;
  for (let i = 0, len = backBillData.length; i < len; i++) {
    const row = backBillData[i];
    if (row[promotionsChildrenField] && row[promotionsChildrenField].length && row[promotionsChildrenField][0].iPromotionType === 4) {
      originCount = originCount + 1;
      const currentKey = `${row.iRetailid}_${row.id}`;
      if (selectedRowKeys.indexOf(currentKey) != -1)
        currentCount = currentCount + 1;
    }
  }
  if (currentCount && currentCount != originCount) {
    cb.utils.alert('固定套餐的商品需要全选', 'error')
    canPass = false;
  }
  return canPass
}

export function setMainSelectedKey (value) {
  return function (dispatch, getState) {
    let serviceData = getState().backBill.toJS().ModalData;
    /* mobile */
    if (cb.rest.terminalType == 3) serviceData = getState().backBill.toJS().CacelModalData;

    const children_selectRowkeys = [];
    if (!serviceData.length) return
    const currentRowData = serviceData.filter(ele => {
      return ele.key == value
    })

    currentRowData[0] && currentRowData[0].retailVouchDetailsArrary.forEach(item => {
      if (Number(item.fCanCoQuantity) != 0)
        children_selectRowkeys.push(`${value}_${item.id}`)
    })
    const middle = {
      mainSelectedKey: value,
      selectedRowKeys: children_selectRowkeys
    }
    dispatch(genAction('PLATFORM_UI_BILLING_BACKBILL_SET_MAIN_SELECTED_KEY', middle));
  }
}

export function setProductSelectedKeys (value, selected) {
  return function (dispatch, getState) {
    const currentChildren = value;
    const mainSelectedKey = getState().backBill.toJS().mainSelectedKey;
    const selectedRowKeys = getState().backBill.toJS().selectedRowKeys;
    const children_selectRowkeys = [];
    const mainId = currentChildren.split('_')[0];
    const middle = {};
    if (selected) {
      middle.mainSelectedKey = mainId;
      if (!mainSelectedKey) {
        children_selectRowkeys.push(value);
        middle.selectedRowKeys = children_selectRowkeys;
      } else if (mainSelectedKey == mainId) {
        selectedRowKeys.push(value);
        middle.selectedRowKeys = selectedRowKeys
      } else if (mainSelectedKey != mainId) {
        children_selectRowkeys.push(value);
        middle.selectedRowKeys = children_selectRowkeys;
      }
    } else {
      const index = selectedRowKeys.indexOf(value);
      if (index > -1) selectedRowKeys.splice(index, 1)
      middle.selectedRowKeys = selectedRowKeys
      if (!selectedRowKeys.length) {
        middle.mainSelectedKey = ''
      } else {
        middle.mainSelectedKey = mainSelectedKey
      }
    }
    dispatch(genAction('PLATFORM_UI_BILLING_BACKBILL_SET_PRODUCT_SELECTED_KEYS', middle))
  }
}

export function dispatchRowClick (whichTable, type, record, callback) {
  return function (dispatch, getState) {
    if (type === 'children') {
      const currenChildrenKeys = getState()[whichTable].get('selectedRowKeys')
      const selected = !(currenChildrenKeys.indexOf(record.key) >= 0);
      callback(record.key, selected)
      return
    }
    if (type === 'father') {
      callback(record.key)
    }
  }
}

export function canOpen (type, isHasAuth, callback) {
  return function (dispatch) {
    const mapping = {
      FormerBackBill: { authType: 'backbill', authCode: 'RM05' },
      NoFormerBackBill: { authType: 'returnproduct', authCode: 'RM06' },
      OnlineBackBill: { authType: 'onlinebackbill', authCode: 'RM24' },
    }
    if (!isHasAuth) {
      dispatch(showOperator(true, false, mapping[type].authType, mapping[type].authCode, callback));
    } else {
      callback();
    }
  }
}

const beforeBackBill = (returnData, selectedData) => {
  const billingViewModel = getBillingViewModel()
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeBackBill', {returnData, selectedData})
}
