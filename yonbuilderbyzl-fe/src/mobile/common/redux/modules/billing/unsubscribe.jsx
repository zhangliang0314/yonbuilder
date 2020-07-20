/**
 * Billing 开单 -> 退订
 */
import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { Format } from '@mdf/cube/lib/helpers/formatDate';
import { RetailVouchBillNo, handlePresellBillData } from './mix';
import { ModifyBillStatus } from './uretailHeader'
import { getBillingViewModel } from './config';

// primaryTableData:[],// 主表数据
// expandedTableData:[],// 嵌套表数据

const ModalData = null;
let productsChildrenField = null;
let BackBillOriginalData = null; // 原始数据
// let goodsTab_totalCount = null;
let mainSelectedKey = null;
let selectedRowKeys = [];

let modalName = '';
let status = null;

const $$initialState = Immutable.fromJS({
  ModalData, // Modal 展示数据
  mainSelectedKey,
  selectedRowKeys, // sku选中的行的key集合  clear
  modalName,
  expandedRowKeys: [],
  searchText: '',
  saleType: '',
  saleTpyeArray: [],
  startTime: '',
  endTime: '',
  goodsTab_totalCount: null, // 退货模态 → 搜索 → 总数据量 clear
  goodsTab_currentPage: 1, // 退货模态 → 搜索 → 当前页码 clear
  inputValue: null, // 退货模态 → 搜索 → 关键字
  loading: true, // 退货模态 → 列表 → 页面加载中
  pageSize: 8, // 退货模态 → 列表 → 每页条数
  visible: false, // 显示 Modal ，visible -> true
  confirmLoading: false,
  saleTpyeDefaultValue: '业务类型',
  /* mobile */
  dataSource: null,
  page: { pIndex: 1, searchTxt: '', type: 'Shipment', pSize: 8 },
});

// Reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    // 退货
    case 'PLATFORM_UI_BILLING_UNSUBSCRIBE':
      return $$state.merge(action.payload)
        .set('visible', true)
        .set('loading', false)
    case 'PLATFORM_UI_PRODUCT_SET_CHILDREN_FIELD':
      productsChildrenField = action.payload;
      return $$state;
    case 'PLATFORM_UI_BILLING_UNSUBSCRIBE_SET_MAIN_SELECTED_KEY':
      mainSelectedKey = action.payload;
      selectedRowKeys = [];
      return $$state.set('mainSelectedKey', mainSelectedKey)
        .set('selectedRowKeys', selectedRowKeys);
    case 'PLATFORM_UI_BILLING_UNSUBSCRIBE_SET_PRODUCT_SELECTED_KEYS':
      selectedRowKeys = action.payload;
      return $$state.set('selectedRowKeys', selectedRowKeys);
    case 'PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLEOK':
      return $$state.set('visible', false)
    case 'PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLE_CANCEL':
      return $$state.set('visible', false)
    case 'PLATFORM_UI_BILLING_UNSUBSCRIBE_SET_OPTIONS':
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_BILLING_UNSUBSCRIBE_CLEAR_REDUX':
      return $$state.merge({
        mainSelectedKey: null,
        selectedRowKeys: [],
        visible: false,
        expandedRowKeys: [],
        goodsTab_currentPage: 1,
        searchText: '',
        saleTpyeArray: [],
        startTime: cb.rest.terminalType == 3 ? '1900-01-01' : '',
        endTime: '',
        saleTpyeDefaultValue: '业务类型'
      })
    /* mobile */
    case 'PLATFORM_UI_BILLING_DATASOURCE':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_BILLING_PAGE':
      return $$state.set('page', action.payload);
    case 'PLATFORM_UI_BILLING_CLEAR_PAGE':
      return $$state.set('page', {
        pIndex: 1, searchTxt: '', type: 'Shipment', pSize: 8
      });
    case 'PLATFORM_UI_BILLING_DATASOURCE_REMOVE_CODE':
      if ($$state.get('dataSource')) {
        let dataSource = $$state.get('dataSource');
        if (!$$state.get('dataSource').totalCount && $$state.get('dataSource').totalCount != 0) {
          dataSource = $$state.get('dataSource').toJS();
        }
        dataSource.totalCount = 0;
        return $$state.set('dataSource', dataSource);
      }
      return $$state;
    default:
      return $$state;
  }
}

export function setOptions (value) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_UNSUBSCRIBE_SET_OPTIONS', value))
  }
}

// 退订 or 交货
export function unsubscribe (init, type, searchText, saleType, pageIndex, pageSize, callback, temPage) {
  if (type) {
    status = type;
    if (type === 'Shipment') {
      modalName = '交货';
    } else if (type === 'PresellBack') {
      modalName = '退订';
    }
  }
  return function (dispatch, getState) {
    const storeId = getState().user.toJS().storeId;
    // fangqg: 解决偶数次取数报错问题
    let { startTime, endTime, page } = getState().unsubscribe.toJS();
    if (init && !startTime && !endTime) {
      startTime = `${Format(new Date(), 'yyyy-MM')}-01`;
      endTime = Format(new Date(), 'yyyy-MM-dd');
      dispatch(genAction('PLATFORM_UI_BILLING_UNSUBSCRIBE_SET_OPTIONS', { startTime, endTime }));
    }
    if (cb.utils.isEmpty(type)) {
      if (cb.rest.terminalType == 3)
        type = page.type
      else
        type = getState().uretailHeader.get('billingStatus')
    }
    let config = {
      url: 'bill/ref/getReserveBill',
      method: 'POST',
      params: {
        searchText: searchText || '', // 搜索框值（单据号、联系人、联系电话）
        beginDate: startTime || null, // 开始时间
        endDate: endTime || null, // 结束时间
        saleType: saleType || '', // 业务类型
        pageSize: pageSize || 8, // 当前页
        pageIndex: pageIndex || 1, // 页大小
        storeId: storeId, // 门店id
        PreselBack: modalName == '交货' ? 1 : 2, // 交货 or 退订
      }
    }
    if (cb.rest.terminalType == 3) {
      status = temPage.type;
      config = {
        url: 'bill/ref/getReserveBill',
        method: 'POST',
        showLoading: false,
        params: {
          searchText: temPage.searchTxt || '', // 搜索框值（单据号、联系人、联系电话）
          beginDate: '1999-01-01', // startTime || null, //开始时间
          endDate: endTime || null, // 结束时间
          saleType: saleType || '', // 业务类型
          pageSize: temPage.pSize || 8, // 当前页
          pageIndex: temPage.pIndex || 1, // 页大小
          storeId: storeId, // 门店id
          PreselBack: type === 'Shipment' ? 1 : 2, // 交货 or 退订
        }
      }
    }
    proxy(config)
      .then(json => {
        if (json.code === 200) {
          const tempDataSource = JSON.parse(JSON.stringify(json.data) + '');

          const primaryTableData = [];// 主表数据
          const saleTpyeArray = [];// 业务类型列表
          const dataSource = json.data.data;// 接口原始数据
          // let increase = 0;
          if (dataSource != undefined) {
            // 主表数据
            dataSource.forEach(function (item, index) {
              // increase += 1;
              const { id, code, vouchdate, iBusinesstypeid_name, iBusinesstypeid, dPlanShipmentDate, fMoneySum, fGatheringMoney, retailVouchDetails, cMobileNo, cCusperson } = item[RetailVouchBillNo];
              primaryTableData.push({
                key: id,
                billsCode: code, // 单据号
                billsDate: vouchdate, // 单据日期
                businessType: iBusinesstypeid_name, // 业务类型
                iBusinessTypeId: iBusinesstypeid, // 业务类型ID
                memberName: cCusperson, // 联系人
                memberPhoneNo: cMobileNo, // 联系电话
                unsubscribeTime: dPlanShipmentDate, // 希望交货日期
                // points: cStoreCode, // 本单积分
                // totalQuantity: 18, // 数量合计
                totalPrice: fMoneySum, // 实销金额
                paid: fGatheringMoney, // 已收款金额
                retailVouchDetailsArrary: retailVouchDetails
              });
              if(status !== undefined)
                saleTpyeArray.push({
                  businessType: iBusinesstypeid_name, // 业务类型
                  iBusinessTypeId: iBusinesstypeid, // 业务类型ID
                });
            });
          }; // 'visible', true
          if (cb.rest.terminalType == 3) {
            if (BackBillOriginalData !== null) {
              BackBillOriginalData.push.apply(BackBillOriginalData, dataSource);
            } else {
              BackBillOriginalData = dataSource;
            }
          } else {
            BackBillOriginalData = dataSource;
          }
          const goodsTab_totalCount = json.data.totalCount;
          /* Menu.jsx 触发 dispatch */
          const payload = status === undefined ? {
            ModalData: primaryTableData,
            modalName: modalName,
            goodsTab_totalCount: goodsTab_totalCount,
          } : {
            ModalData: primaryTableData,
            modalName: modalName,
            goodsTab_totalCount: goodsTab_totalCount,
            saleTpyeArray: saleTpyeArray
          }
          if (cb.rest.terminalType == 3) {
            if (getState().unsubscribe.toJS().dataSource !== null) {
              let arrData = getState().unsubscribe.toJS().dataSource.data;
              arrData = _.unionWith(arrData, tempDataSource.data, (oldObj, newObj) => {
                return oldObj.rm_retailvouch.code === newObj.rm_retailvouch.code;
              });
              arrData = _.sortBy(arrData, (obj) => {
                return -new Date(obj.rm_retailvouch.createTime).getTime();
              })
              tempDataSource.data = arrData;
            }
            if (tempDataSource.totalCount >= tempDataSource.data.length) {
              payload.dataSource = tempDataSource;
            }
            if (temPage) {
              payload.page = temPage;
            }
          }
          dispatch(genAction('PLATFORM_UI_BILLING_UNSUBSCRIBE', payload));
        } else if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
        }
      })
    if (cb.rest.terminalType == 3) callback();
  }
}

// Modal 控制
export function unsubscribeModalControl (type, billStatus) {
  if (!cb.utils.isEmpty(billStatus)) status = billStatus;
  return function (dispatch, getState) {
    const mainSelectedKey = getState().unsubscribe.toJS().mainSelectedKey;// 用redux里的实时数据

    /* add by jinzh1 获取当前补单状态及单据日期 */
    const { vouchdate } = getState().uretailHeader.toJS().infoData;

    switch (type) {
      case 'handleOk': {
        if (!mainSelectedKey) {
          cb.utils.alert('请先选择单据', 'error');
          return;
        }
        // 在此处理交货和退订的逻辑
        if (!BackBillOriginalData) return;
        const selectedData = BackBillOriginalData.find(item => {
          return item[RetailVouchBillNo].id === mainSelectedKey;
        });

        /* add by jinzh1 补单日期不能小于预订日期 */
        const dPresellDate = selectedData[RetailVouchBillNo].dPresellDate;/* 预定日期 */
        if (vouchdate && ((new Date(vouchdate.replace(/-/g, '/'))) < (new Date(dPresellDate.replace(/-/g, '/'))))) {
          cb.utils.alert('补单日期不能小于预订日期！', 'error');
          return;
        }

        dispatch(ModifyBillStatus(status));/* modify by jinzh1 2017-11-23 更新单据状态 */

        if (!selectedData) return;
        const returnData = JSON.parse(JSON.stringify(selectedData));
        const returnRetailData = returnData[RetailVouchBillNo];
        returnRetailData.iRelatingRetailid = returnRetailData.id;
        // delete returnRetailData.id;
        if (selectedRowKeys.length)
          returnRetailData[productsChildrenField] = returnRetailData[productsChildrenField].filter(item => {
            return selectedRowKeys.indexOf(mainSelectedKey + '_' + item.id) > -1;
          });
        const billingStatus = getState().uretailHeader.toJS().billingStatus;
        returnRetailData[productsChildrenField].forEach(item => {
          item.iRelatingRetailDetailId = item.id;
          const specArr = [];
          if (!item.productsku) {
            billingStatus == 'PresellBack' ? item.specsBtn = false : item.specsBtn = true;
          } else {
            for (const attr in item) {
              if (attr.startsWith('free'))
                specArr.push(item[attr])
            }
            item.specs = specArr.join(',')
          }
          // delete item.id;
        });
        if (!beforeUnsubcribeOkClick(returnData)) return
        dispatch(genAction('PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLEOK'));
        dispatch(handlePresellBillData(returnData, selectedData, status));
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

const beforeUnsubcribeOkClick = (returnData) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeUnsubscribeOkClick', returnData)
}

export function setMainSelectedKey (value) {
  return genAction('PLATFORM_UI_BILLING_UNSUBSCRIBE_SET_MAIN_SELECTED_KEY', value);
}

export function setProductSelectedKeys (value) {
  return genAction('PLATFORM_UI_BILLING_UNSUBSCRIBE_SET_PRODUCT_SELECTED_KEYS', value);
}

export function clearUnsubscribeRedux (value) {
  return genAction('PLATFORM_UI_BILLING_UNSUBSCRIBE_CLEAR_REDUX');
}

/* mobile */
export function clearDataSource (value) {
  return async (dispatch, getState) => {
    await dispatch(genAction('PLATFORM_UI_BILLING_DATASOURCE', { dataSource: value }));
  }
}
export function initPageInfo () {
  return async (dispatch, getState) => {
    await dispatch(genAction('PLATFORM_UI_BILLING_CLEAR_PAGE'));
  }
}
export function setPageInfo (value) {
  return genAction('PLATFORM_UI_BILLING_PAGE', value);
}
