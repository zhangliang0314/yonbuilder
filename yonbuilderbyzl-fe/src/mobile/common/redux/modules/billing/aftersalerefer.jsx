/**
 * Copy from UNSUBSCRIBE.jsx
 */
import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { Format } from '@mdf/cube/lib/helpers/formatDate';
import { RetailVouchBillNo, handleAfterSaleData } from './mix';
// import BillingStatus from './billingStatus';
import { ModifyBillStatus } from './uretailHeader'
import { showSalesClerkModal } from './salesClerk'
import { getDefaultBusinessType } from './reserve';

// primaryTableData:[],// 主表数据
// expandedTableData:[],// 嵌套表数据

const ModalData = null;
// let productsChildrenField = null;
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
  searchText1: '',
  searchText2: '',
  searchText3: '',
  // saleType: '',
  // saleTypeArray: [],
  startTime: '',
  endTime: '',
  goodsTab_totalCount: null, // 退货模态 → 搜索 → 总数据量 clear
  goodsTab_currentPage: 1, // 退货模态 → 搜索 → 当前页码 clear
  inputValue: null, // 退货模态 → 搜索 → 关键字
  loading: true, // 退货模态 → 列表 → 页面加载中
  pageSize: 8, // 退货模态 → 列表 → 每页条数
  visible: false, // 显示 Modal ，visible -> true
  confirmLoading: false,
  // saleTpyeDefaultValue: '业务类型'
});

// Reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    // 退货
    case 'PLATFORM_UI_BILLING_AFTERSALEREFER':
      return $$state.merge(action.payload)
        .set('visible', true)
        .set('loading', false)
    case 'PLATFORM_UI_PRODUCT_SET_CHILDREN_FIELD':
      // productsChildrenField = action.payload;
      return $$state;
    case 'PLATFORM_UI_BILLING_AFTERSALEREFER_SET_MAIN_SELECTED_KEY':
      mainSelectedKey = action.payload;
      selectedRowKeys = [];
      return $$state.set('mainSelectedKey', mainSelectedKey)
        .set('selectedRowKeys', selectedRowKeys);
    case 'PLATFORM_UI_BILLING_AFTERSALEREFER_SET_PRODUCT_SELECTED_KEYS':
      selectedRowKeys = action.payload;
      return $$state.set('selectedRowKeys', selectedRowKeys);
    case 'PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLEOK':
      return $$state.set('visible', false)
    case 'PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLE_CANCEL':
      return $$state.set('visible', false)
    case 'PLATFORM_UI_BILLING_AFTERSALEREFER_SET_OPTIONS':
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_BILLING_AFTERSALEREFER_CLEAR_REDUX':
      return $$state.merge({
        mainSelectedKey: null,
        selectedRowKeys: [],
        visible: false,
        expandedRowKeys: [],
        goodsTab_currentPage: 1,
        searchText1: '',
        searchText2: '',
        searchText3: '',
        // saleTypeArray: [],
        startTime: '',
        endTime: '',
        // saleTpyeDefaultValue: '业务类型'
      })
    default:
      return $$state;
  }
}

export function setOptions (value) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_AFTERSALEREFER_SET_OPTIONS', value))
  }
}

export function aftersalerefer (init, type, searchText1, searchText2, searchText3, pageIndex, pageSize) {
  if (type) {
    status = type;
    if (type === 'AfterSaleService') {
      modalName = '售后服务';
    }
  }
  return function (dispatch, getState) {
    const storeId = getState().user.toJS().storeId;
    console.log('售后服务------ ' + 'storeId  = ' + storeId);
    let startTime = getState().aftersalerefer.toJS().startTime;
    let endTime = getState().aftersalerefer.toJS().endTime;
    if (init && !startTime && !endTime) {
      startTime = `${Format(new Date(), 'yyyy-MM')}-01`;
      endTime = Format(new Date(), 'yyyy-MM-dd');
      dispatch(genAction('PLATFORM_UI_BILLING_AFTERSALEREFER_SET_OPTIONS', { startTime, endTime }));
    }

    const config = {
      // url: 'bill/ref/getReserveBill',
      url: 'bill/ref/getaftersale',
      method: 'POST',
      params: {

        // beginDate: startTime || null, //开始时间
        // endDate: endTime || null, //结束时间

        vouchcode: searchText1 || '', // 单据编号
        customer: searchText2 || '', // 客户 手机号/姓名
        product: searchText3 || '', // 商品/批次号
        pageSize: pageSize || 8, // 当前页
        pageIndex: pageIndex || 1, // 页大小

        // saleType: saleType || '',// 业务类型
        // storeId: storeId, //门店id
      }
    }

    proxy(config)
      .then(json => {
        if (json.code === 200) {
          const primaryTableData = [];// 主表数据
          // const saleTypeArray = [];// 业务类型列表
          const dataSource = json.data.data;// 接口原始数据
          // let increase = 0;
          if (dataSource != undefined) {
            // 主表数据
            dataSource.forEach(function (item, index) {
              // increase += 1;
              const { id, code, dMakeDate, customerName, phone, product_cName, totalCost, receiverid_name, retailVouchDetails } = item[RetailVouchBillNo];
              primaryTableData.push({
                key: id,
                billsCode: code, // 单据号
                billsDate: dMakeDate.substring(0, 10), // 单据日期
                customerName: customerName, // 客户姓名
                phone: phone, // 手机号
                product_cName: product_cName, // 商品
                totalCost: totalCost, // 费用合计
                receiverid_name: receiverid_name, // 收取人
                // businessType: iBusinesstypeid_name,//业务类型
                // iBusinessTypeId: iBusinesstypeid,//业务类型ID
                // memberName: cCusperson, // 联系人
                // memberPhoneNo: cMobileNo, // 联系电话
                // aftersalereferTime: dPlanShipmentDate, // 希望交货日期
                // // points: cStoreCode, // 本单积分
                // // totalQuantity: 18, // 数量合计
                // totalPrice: fMoneySum, // 实销金额
                // paid: fGatheringMoney, // 已收款金额
                retailVouchDetailsArrary: retailVouchDetails
              });
              // status === undefined ? undefined :
              //   saleTypeArray.push({
              //     businessType: iBusinesstypeid_name,//业务类型
              //     iBusinessTypeId: iBusinesstypeid,//业务类型ID
              //   });
            });
          }; // 'visible', true

          BackBillOriginalData = dataSource;
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
            // saleTypeArray: saleTypeArray
          }
          dispatch(genAction('PLATFORM_UI_BILLING_AFTERSALEREFER', payload));
        } else if (json.code !== 200) {
          console.log('售后服务------调用getaftersale异常 json.message = ' + json.message);
        }
      })
  }
}

// Modal 控制
export function afterSaleReferModalControl (type) {
  return function (dispatch, getState) {
    const mainSelectedKey = getState().aftersalerefer.toJS().mainSelectedKey;// 用redux里的实时数据

    /* add by jinzh1 获取当前补单状态及单据日期 */
    // const { bRepair, vouchdate } = getState().uretailHeader.toJS().infoData;

    switch (type) {
      case 'handleOk': {
        if (!mainSelectedKey) {
          cb.utils.alert('请先选择单据', 'error');
          return;
        }

        if (!BackBillOriginalData) return;
        const callback = () => {
          const selectedData = BackBillOriginalData.find(item => {
            return item[RetailVouchBillNo].id === mainSelectedKey;
          });
          dispatch(ModifyBillStatus(status));
          dispatch(getDefaultBusinessType('8'))
          if (!selectedData) return;
          const returnData = JSON.parse(JSON.stringify(selectedData));
          const returnRetailData = returnData[RetailVouchBillNo];

          // returnRetailData.iBusinesstypeid = 582762858999999;
          // returnRetailData.iBusinesstypeid_name = "laladfjlkasdf";
          returnRetailData.iRelatingRetailid = returnRetailData.id;
          // delete returnRetailData.id;

          // if (selectedRowKeys.length)
          //   returnRetailData[productsChildrenField] = returnRetailData[productsChildrenField].filter(item => {
          //     return selectedRowKeys.indexOf(mainSelectedKey + '_' + item.id) > -1;
          //   });

          // let billingStatus = getState().uretailHeader.toJS().billingStatus;
          // returnRetailData[productsChildrenField].forEach(item => {
          //   item.iRelatingRetailDetailId = item.id;
          //   let specArr = [];
          //   if (!item.productsku) {
          //     billingStatus == 'PresellBack' ? item.specsBtn = false : item.specsBtn = true;
          //   } else {
          //     for (let attr in item) {
          //       if (attr.startsWith('free'))
          //         specArr.push(item[attr])
          //     }
          //     item.specs = specArr.join(',')
          //   }
          //   // delete item.id;
          // });
          dispatch(genAction('PLATFORM_UI_BILLING_MODAL_CONTROL_HANDLEOK'));
          dispatch(handleAfterSaleData(returnData, selectedData, status));
        }
        dispatch(showSalesClerkModal(callback));

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

export function setMainSelectedKey (value) {
  return genAction('PLATFORM_UI_BILLING_AFTERSALEREFER_SET_MAIN_SELECTED_KEY', value);
}

export function setProductSelectedKeys (value) {
  return genAction('PLATFORM_UI_BILLING_AFTERSALEREFER_SET_PRODUCT_SELECTED_KEYS', value);
}

export function clearAfterSaleReferRedux (value) {
  return genAction('PLATFORM_UI_BILLING_AFTERSALEREFER_CLEAR_REDUX');
}
