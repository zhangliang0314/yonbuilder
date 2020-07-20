import Immutable from 'immutable';
import Cookies from 'cookies-js';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { modfiySnPrice, setFocusedRow, getGlobalProducts } from './product';
import { goBack } from 'react-router-redux'
import { getBillingStatus } from './uretailHeader';
import { getRetailVoucherData } from './mix';
import { showModal, execUpdateBackInfo, backInfoParams } from './actions';
import { getOptions } from './mix';
import { getBillingViewModel } from './config';
import { canOpenEmplyee } from './salesClerk';

let cacheWareHouseDataSource = [];/* 缓存门店仓数据 */
const $$initialState = Immutable.fromJS({
  WareHouse_DataSource: [], /* 仓库数据源 */
  Define_DataSource: [], /* 自定义项数据源 */
  Batch_DataSource: [], /* 批号数据源 */
  Available: 0, /* 现存量 */
  rowData: {}, /* 行数据 */
  bCheckDetail: false, /* 是否  结算前数据检查 */
  checkedRows: [], /* 不符合 必输条件的行 */
  isRef: true,
  activeKey: 'editRow', /* 改行or退货信息 */
  showBackInfo: true, /* 是否显示退货页签   扩展脚本用 */
  /* mobile */
  isBatchBack: false,
  isSnBack: false,
  editRowIndex: 1,
  readState: []
});
let bRefReturn = false;
let productsChildrenField = null;
let editRowModel = null;
export default ($$state = $$initialState, action) => {
  let rowData = $$state.get('rowData').toJS();
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_EDITROW_SET_ROWDATA':
      return $$state.set('rowData', Immutable.fromJS(action.payload));
    case 'PLATFORM_UI_BILLING_SET_COMMON_DATA':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_BILLING_EDITROW_GET_WAREHOUSE_DATASOURCE':
      cacheWareHouseDataSource = action.payload;
      return $$state.set('WareHouse_DataSource', action.payload);
    case 'PLATFORM_UI_BILLING_EDITROW_GET_BATCH_DATASOURCE':
      return $$state.set('Batch_DataSource', action.payload);
    case 'PLATFORM_UI_BILLING_EDITROW_GET_SN_DATASOURCE':
      return $$state.set('SN_DataSource', action.payload);
    case 'PLATFORM_UI_BILLING_CLEAR_TOUCH':
    case 'PLATFORM_UI_BILLING_CLEAR':
      return $$state.merge({
        // WareHouse_DataSource: [], /*仓库数据源*/
        // Define_DataSource: [], /*自定义项数据源*/
        Batch_DataSource: [], /* 批号数据源 */
        SN_DataSource: [], /* 序列号 */
        Available: 0, /* 现存量 */
        rowData: {}, /* 行数据 */
        bCheckDetail: false, /* 是否  结算前数据检查 */
        checkedRows: [], /* 不符合 必输条件的行 */
        isRef: true,
        activeKey: 'editRow', /* 改行or退货信息 */
        /* mobile */
        isBatchBack: false,
        isSnBack: false,
        editRowIndex: 1,
        showBackInfo: true
      });
    /* mobile */
    case 'BILLING_REFER_EDITROW_WAREHOUSE_RETURN':/* 仓库-参照返回 */
      rowData.iWarehouseid = action.payload.warehouse;
      rowData.iWarehouseid_name = action.payload.warehouse_name;
      rowData.cBatchno = '';
      rowData.invaliddate = undefined;
      bRefReturn = true;
      return $$state.merge({ rowData: rowData });
    case 'BILLING_REFER_EDITROW_BATCHNO_RETURN': { /* 批号-参照返回 */
      bRefReturn = true;
      const iBathidMeta = $$state.get('iBathidMeta').toJS();
      rowData = row2refer(iBathidMeta, rowData, action.payload);
      return $$state.merge({ rowData: rowData, Available: action.payload.availableqty, isBatchBack: true });
    }
    case 'BILLING_REFER_EDITROW_SN_RETURN': { /* 序列号-参照返回 */
      bRefReturn = true;
      const snMeta = $$state.get('snMeta').toJS();
      rowData = row2refer(snMeta, rowData, action.payload);
      return $$state.merge({ rowData: rowData, isSnBack: true });
    }
    case 'BILLING_REFER_EDITROW_DEFINE_RETURN': { /* 自定义项-参照返回 */
      bRefReturn = true;
      const { name, value } = action.payload;
      rowData[name] = value.name;
      return $$state.merge({ rowData: rowData });
    }
    case 'BILLING_REFER_SALESCLERK_RETURN':
      bRefReturn = true;
      rowData.iEmployeeid = action.payload.id;
      rowData.iEmployeeid_name = action.payload.name;
      return $$state.merge({ rowData: rowData });
    case 'PLATFORM_UI_PRODUCT_SET_CHILDREN_FIELD':
      productsChildrenField = action.payload;
      return $$state;
    case 'PLATFORM_UI_BILLING_VIEWMODEL_INIT':
      editRowModel = action.payload.get(productsChildrenField || 'retailVouchDetails').getEditRowModel();
      return $$state.set('viewMeta', action.payload.getViewMeta('rm_retailvouch_edit_rows_info'))
        .set('viewMeta_inrow', action.payload.getViewMeta('rm_retailvouch_body_edit_row_extension'));
    case 'BILLING_REFER_EDITROW_VALUECHNGED':
      rowData[action.payload.name] = action.payload.value;
      return $$state.merge({ rowData: rowData });

    case 'BILLING_REFER_EDITROW_SETREADONLY': {
      const readState = $$state.get('readState').toJS();

      const tmpName = action.payload.name;
      const readOnly = action.payload.readOnly;
      _.remove(readState, function (o) { return o.name == tmpName })
      readState.push({ name: tmpName, readOnly: !!readOnly });
      return $$state.merge({ readState: readState });
    }
    default:
      return $$state;
  }
}
const connectViewModel = function (dispatch) {
  const VirtualListener = function () { }
  VirtualListener.prototype.setValue = function (value, propertyName) {
    if (propertyName == 'iWarehouseid' || propertyName == 'iWarehouseid_name') {
      dispatch(genAction('BILLING_REFER_EDITROW_VALUECHNGED', { name: propertyName, value: value }));
    }
  }

  // VirtualListener.prototype.setState = function (value, propertyName) {
  //   console.log("VirtualListener.prototype.setState ----> propertyName = " + propertyName + "  value =" + value);
  //   dispatch(genAction('BILLING_REFER_EDITROW_VALUECHNGED', { name: propertyName, value: value }));
  // }
  VirtualListener.prototype.setDisabled = function (disabled, propertyName) {
    dispatch(genAction('BILLING_REFER_EDITROW_SETREADONLY', { name: propertyName, readOnly: disabled }));
  }
  VirtualListener.prototype.setReadOnly = function (disabled, propertyName) {
    dispatch(genAction('BILLING_REFER_EDITROW_SETREADONLY', { name: propertyName, readOnly: disabled }));
  }
  const virtualListener = new VirtualListener();
  const propertyNames = editRowModel._get_data('propertyNames');
  console.log('virtualListener editRowModel.get(item).addListener  ----> propertyNames = ' + JSON.stringify(propertyNames));
  propertyNames.forEach(item => {
    typeof (editRowModel.get(item)) == 'object' && typeof (editRowModel.get(item).addListener) === 'function' && editRowModel.get(item).addListener(virtualListener);
  });
}
const row2refer = (meta, rowData, data) => {
  let cRefRetId = meta.cRefRetId;
  try {
    if (!cRefRetId || cRefRetId == '') {
      cRefRetId = {};
    } else {
      // cRefRetId = JSON.parse(cRefRetId);
      cRefRetId = cb.utils.getBill2ReferKeyFieldMap(cRefRetId);
    }
  } catch (e) {
    cb.utils.alert('参照携带预制错误', 'error');
  }
  for (var key in cRefRetId) {
    const refKey = cRefRetId[key];
    if (data[refKey]) {
      rowData[key] = data[refKey];
    }
  }
  return rowData;
}

/* 初始化 */
export function initData () {
  return function (dispatch, getState) {
    let { bCheckDetail, rowData, WareHouse_DataSource } = getState().editRow.toJS();
    connectViewModel(dispatch);
    if (bRefReturn) {
      bRefReturn = false;
      if (!cb.utils.isEmpty(rowData.key)) return;
    }
    let focusedRow = getState().product.get('focusedRow');
    if (Immutable.Map.isMap(focusedRow)) focusedRow = focusedRow.toJS();

    const billingStatus = getBillingStatus();

    const { warehouse } = getState().uretailHeader.get('infoData').toJS();
    const takeWay = getState().reserve.get('takeWay').toJS();
    if (takeWay.id == 2 && warehouse.id) {
      const data = getState().reserve.get('WareHouse_DataSource');
      WareHouse_DataSource = [];
      data && data.length > 0 && data.map(item => {
        WareHouse_DataSource.push({
          warehouse: item.id, warehouse_name: item.name, warehouse_erpCode: item.erpCode
        });
      });
    } else {
      WareHouse_DataSource = cacheWareHouseDataSource;
    }

    if (bCheckDetail == false || rowData.key != focusedRow.key) {
      dispatch(genAction('PLATFORM_UI_BILLING_EDITROW_SET_ROWDATA', focusedRow));
      editRowModel.loadData(focusedRow);
      if (focusedRow.warehouse_isGoodsPosition) dispatch(getGoodsPositionData(focusedRow))
      onOpenEditRow(focusedRow)
    } else {
      editRowModel.loadData(rowData);
      onOpenEditRow(rowData)
      if (focusedRow.warehouse_isGoodsPosition) dispatch(getGoodsPositionData(rowData))
    }
    let activeKey = 'editRow';
    if (billingStatus == 'NoFormerBackBill' || billingStatus == 'FormerBackBill') {
      if (focusedRow.fQuantity < 0) activeKey = 'backInfo';
    }
    // if (cb.rest.terminalType == 3) dispatch(getSalesList());
    /* 初始化 批次数据及可用量 */
    if (focusedRow.warehouse_isGoodsPosition)
      dispatch(getAvailable(rowData.iWarehouseid, focusedRow.goodsposition));
    else
      dispatch(getAvailable(rowData.iWarehouseid));
    const args = { activeKey: activeKey };
    afterInitEditRowData(args);
    dispatch(genAction('PLATFORM_UI_BILLING_SET_COMMON_DATA', Object.assign(args, { billingStatus, WareHouse_DataSource })));
  }
}
/* 改行 init后事件 */
const afterInitEditRowData = (params) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('afterInitEditRowData', { params })
}
export function setEditRowData (data) {
  return function (dispatch, getState) {
    dispatch(genAction('PLATFORM_UI_BILLING_EDITROW_SET_ROWDATA', data));
  }
}

export function setCommonData (data) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_SET_COMMON_DATA', data));
  }
}

/**/
export function changeRow (val) {
  return genAction('PLATFORM_UI_BILLING_CHANGE_ROW', val);
}

/* 获取门店仓库信息 */
export function getStoreWareHouse (rowData) {
  return function (dispatch, getState) {
    const storeId = getState().user.toJS().storeId;
    if (!rowData) rowData = getState().editRow.toJS().rowData;
    const config = {
      url: 'billTemplateSet/getCurrentStoreWarehouse',
      method: 'GET',
      params: { storeId: storeId, cabinetGroup: Cookies.get('pos_cabinetgroup') || null}
    };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
          return
        }
        const { defaultWarehouse, otherWarehouse } = json.data;
        if (!rowData.iWarehouseid || rowData.iWarehouseid == '' && defaultWarehouse.warehouse) {
          rowData.iWarehouseid = json.data.defaultWarehouse.warehouse;
          if (cb.rest.terminalType == 3) {
            for (var i = 0; i < otherWarehouse.length; i++) {
              if (otherWarehouse[i].warehouse == rowData.iWarehouseid) {
                rowData.iWarehouseid_name = otherWarehouse[i].warehouse_name;
                break;
              }
            }
          }
        }
        dispatch(getAvailable(rowData.iWarehouseid));
        dispatch(getGoodsPositionData(rowData))
        dispatch(genAction('PLATFORM_UI_BILLING_EDITROW_SET_ROWDATA', rowData));
        dispatch(genAction('PLATFORM_UI_BILLING_EDITROW_GET_WAREHOUSE_DATASOURCE', otherWarehouse));
      });
  }
}

/* 获取自定义项及 */
export function loadEditColumns (data, iBathidMeta, snMeta) {
  return function (dispatch) {
    const define2Meta = {};
    data.define.forEach(element => {
      define2Meta[element.variable] = element.metaData;
    });
    dispatch(genAction('PLATFORM_UI_BILLING_SET_COMMON_DATA', {
      Define_DataSource: data.define,
      editColumn: data.common,
      define2Meta: define2Meta,
      iBathidMeta: iBathidMeta,
      snMeta: snMeta,
    }));
  }
}

/* 获取仓库数据源 */
export function getWareHouse () {
  return function (dispatch) {
    const config = {
      url: 'bill/list',
      method: 'POST',
      params: {
        page: { pageSize: 1000, pageIndex: 1 },
        condition: {
          commonVOs: [
            { itemName: 'schemeName', value1: 'aa_warehouselist' },
            { value1: '1', itemName: 'wStore' }
          ], filtersId: '514984', solutionId: 502791
        }, billnum: 'aa_warehouselist'
      }
    };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
          return
        }
        const data = json.data.recordList;
        dispatch(genAction('PLATFORM_UI_BILLING_EDITROW_GET_WAREHOUSE_DATASOURCE', data));
      });
  }
}

export function onChangeWarehouse (iWarehouseid, goodsposition) {
  return function (dispatch, getState) {
    dispatch(getAvailable(iWarehouseid, goodsposition));
  }
}
/* 获取批号/效期/现存量 */
export function getAvailable (warehouse, goodsposition) {
  return function (dispatch, getState) {
    const rowData = getState().editRow.toJS().rowData;
    // let position = goodsposition;
    const config = {
      url: 'billingretail/batchExpAvail',
      method: 'POST',
      params: {
        warehouse: warehouse || rowData.iWarehouseid,
        isBatch: rowData.product_productOfflineRetail_isBatchManage ? 1 : 0,
        productsku: rowData.productsku,
        product: rowData.product,
        goodsposition: goodsposition || null
      }
    };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
          return
        }
        let Available = json.data.availableqtyTotal;
        if (rowData.cBatchno && rowData.cBatchno != '') {
          Available = 0;
          json.data.list.map(data => {
            if (data.batchno && rowData.cBatchno == data.batchno) {
              Available = data.availableqty;
            }
          });
        }
        dispatch(genAction('PLATFORM_UI_BILLING_EDITROW_GET_BATCH_DATASOURCE', json.data.list));
        dispatch(genAction('PLATFORM_UI_BILLING_SET_COMMON_DATA', { Available: Available }));
      });
  }
}

export function execEdit (bPagination, paginationIndex) {
  return function (dispatch, getState) {
    bRefReturn = false;
    const { billingStatus, infoData } = getState().uretailHeader.toJS();
    const industry = getState().user.toJS().tenant.industry;/* 所属行业 */
    const { rowData, bCheckDetail, checkedRows, Available, activeKey, Define_DataSource } = getState().editRow.toJS();

    let focusedRow = getState().product.get('focusedRow');
    if (Immutable.Map.isMap(focusedRow)) focusedRow = focusedRow.toJS();

    const check = checkRow(rowData, getState());
    if (!check) {
      if (activeKey == 'backInfo')
        dispatch(genAction('PLATFORM_UI_BILLING_SET_COMMON_DATA', { activeKey: 'editRow' }));
      return;
    }

    const callback = async (bSuccess, backRow) => {
      if (!bSuccess) {
        if (activeKey == 'editRow')
          dispatch(genAction('PLATFORM_UI_BILLING_SET_COMMON_DATA', { activeKey: 'backInfo' }));
        return;
      }

      if (rowData.cBatchno == '') rowData.cBatchno = null;
      rowData.fAvailableAuantity = Available;
      /* 合并退货信息row */
      backRow.cBatchno = rowData.cBatchno;
      backRow.cSerialNo = rowData.cSerialNo;/* 序列号 */
      backRow.fAvailableAuantity = rowData.fAvailableAuantity;
      backRow.iWarehouseid = rowData.iWarehouseid;
      backRow.goodsposition = rowData.goodsposition;
      if (cb.rest.terminalType == 3) backRow.iWarehouseid_name = rowData.iWarehouseid_name;
      backRow.invaliddate = rowData.invaliddate;
      backRow.producedate = rowData.producedate;
      backRow.warehouse_isGoodsPosition = rowData.warehouse_isGoodsPosition;
      backRow.cMemo = rowData.cMemo;
      Define_DataSource.map(define => {
        if (industry == 17 && define.dataIndex == 'retailVouchDetailCustom!define1') {
          // return
        }
        else
          backRow[define.dataIndex] = editRowModel.get(define.dataIndex).getValue();
        // backRow[define.dataIndex] = rowData[define.dataIndex];
      });
      let bSnChange = false;
      if (focusedRow.cSerialNo != backRow.cSerialNo) bSnChange = true;
      /* add by jinzh1 交货 且 交货不可改 或 电商订单来源行 不执行重新取价 */
      if ((billingStatus == 'Shipment' && !infoData.bDeliveryModify) ||
        (billingStatus == 'OnlineBill' && !cb.utils.isEmpty(backRow.iRelatingRetailDetailId)))
        bSnChange = false;

      if (bSnChange) {
        if (hasPreferential(getState(), '已经执行过优惠，不允许修改序列号！')) return
      }

      const returnData = await beforeUpdateRow(backRow)
      if (!returnData) return

      if (bCheckDetail) {
        const nowKey = backRow.key;
        for (var i = 0; i < checkedRows.length; i++) {
          if (checkedRows[i].key == nowKey) {
            checkedRows.splice(i, 1);
            break;
          }
        }
        if (bSnChange)
          dispatch(modfiySnPrice(backRow));
        else
          dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', backRow));
        if (checkedRows.length == 0) {
          dispatch(setFocusedRow(backRow));
          dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
          dispatch(genAction('PLATFORM_UI_BILLING_SET_COMMON_DATA', { bCheckDetail: false }));
        } else {
          dispatch(getStoreWareHouse(checkedRows[0]));
          // dispatch(setFocusedRow(checkedRows[0]));
          dispatch(genAction('PLATFORM_UI_BILLING_SET_COMMON_DATA', { checkedRows: checkedRows, rowData: checkedRows[0] }));
        }
      } else {
        if (bSnChange)
          dispatch(modfiySnPrice(backRow));
        else
          dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', backRow));
        dispatch(setFocusedRow(backRow));
        if (!bPagination) dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
      }

      if (bPagination) {
        const products = getGlobalProducts();
        const row = products[paginationIndex];
        if (row) {
          setTimeout(() => {
            dispatch(setFocusedRow(row, paginationIndex));
            dispatch(initData());
            dispatch(getStoreWareHouse());
            dispatch(backInfoParams());
          }, 200);
        }
      }

      /* 移动端交互 */
      if (cb.rest.terminalType == 3) dispatch(goBack());
    }
    if ((billingStatus == 'FormerBackBill' || billingStatus == 'NoFormerBackBill') && rowData.fQuantity < 0) {
      dispatch(execUpdateBackInfo(callback));
    } else {
      callback(true, rowData);
    }
  }
}
/* 改行---确定前事件 */
const beforeUpdateRow = async (row = {}) => {
  const billingViewModel = getBillingViewModel()
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.warpPromiseExecute('beforeUpdateRow', { row: row })
}
/* 校验行数据 */
const checkRow = (rowData, globalState, goCash) => {
  const { Define_DataSource, WareHouse_DataSource } = globalState.editRow.toJS();
  // let { infoData } = globalState.uretailHeader.toJS();
  const billingStatus = getBillingStatus();
  const autoDesignOutStockBatch = (getOptions().autoDesignOutStockBatch ? getOptions().autoDesignOutStockBatch.value : false); // 出库批号自动指定
  const autoDesignRetailPosition = (getOptions().autoDesignRetailPosition ? getOptions().autoDesignRetailPosition.value : false); // 出库货位自动指定
  /* 现销  交货  退货 */
  if (((billingStatus == 'CashSale' || billingStatus == 'Shipment' || billingStatus == 'OnlineBill') && !autoDesignOutStockBatch) || billingStatus == 'OnlineBackBill' || billingStatus == 'FormerBackBill' || billingStatus == 'NoFormerBackBill' || billingStatus == 'AfterSaleService') {
    if (rowData.product_productOfflineRetail_isBatchManage) { /* 启用批次管理 */
      if (!rowData.cBatchno || rowData.cBatchno == '') {
        goCash === true
          ? cb.utils.alert('当前网络不可用，不能销售批次管理的商品！', 'error')
          : cb.utils.alert('商品(' + rowData.product_cName + ')启用了批次管理，请输入批号！', 'error');
        return false;
      }
      if (billingStatus == 'Shipment') {
        if (rowData.product_productOfflineRetail_isExpiryDateManage) { /* 启用效期管理 */
          if (!rowData.cBatchno || rowData.cBatchno == '' || !rowData.invaliddate || rowData.invaliddate == '') {
            goCash === true ? cb.utils.alert('当前网络不可用，不能销售有效期管理的商品！', 'error') : cb.utils.alert('预订交货状态下,批号效期为必输！', 'error');
            return false;
          }
        }
      }
    }
    if (rowData.product_productOfflineRetail_isExpiryDateManage) { /* 启用效期管理 */
      if (!rowData.invaliddate || rowData.invaliddate == '') {
        cb.utils.alert('商品(' + rowData.product_cName + ')启用了效期管理，请输入效期！', 'error');
        return false;
      }
    }
  }
  /* 货位校验 */
  // if (rowData.warehouse_isGoodsPosition && !rowData.goodsposition && infoData.takeWay && infoData.takeWay.id != 2 && billingStatus != 'PresellBack' && !autoDesignRetailPosition) {
  if (rowData.warehouse_isGoodsPosition && !rowData.goodsposition && billingStatus !== 'PresellBill' && billingStatus != 'PresellBack' && !autoDesignRetailPosition) {
    cb.utils.alert(`${rowData.product_cName}商品货位必输！`, 'error')
    return false
  }
  if (billingStatus == 'CashSale' || billingStatus == 'AfterSaleService' || billingStatus == 'Shipment' || billingStatus == 'OnlineBill' || billingStatus == 'OnlineBackBill' || billingStatus == 'FormerBackBill' || billingStatus == 'NoFormerBackBill') {
    if (rowData.product_productOfflineRetail_isSerialNoManage) { /* 启用序列号管理 */
      let warehouse_iSerialManage = true;
      WareHouse_DataSource.map(warehouse => {
        if (warehouse.warehouse_id == rowData.iWarehouseid)
          warehouse_iSerialManage = warehouse.warehouse_iSerialManage;
      });
      if ((!rowData.cSerialNo || rowData.cSerialNo == '') && warehouse_iSerialManage) {
        goCash === true
          ? cb.utils.alert('当前网络不可用，不能销售序列号管理的商品！', 'error')
          : cb.utils.alert('商品(' + rowData.product_cName + ')启用了序列号管理，请输入序列号！', 'error');
        return false;
      }
    }
  }
  let checkDefine = true;
  Define_DataSource.forEach(define => {
    const meta = define.metaData;
    const key = define.dataIndex;
    if (meta.bIsNull == false) {
      const val = editRowModel.get(key).getValue();
      if (!val || val == '') {
        cb.utils.alert(`存在必输项 “${meta.cShowCaption}”,请输入后重试！`, 'error');
        checkDefine = false;
      }
    }
  });
  return checkDefine;
}

/* checkDetail后事件 */
const afterCheckDetail = (obj) => {
  const billingViewModel = getBillingViewModel()
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('afterCheckDetail', obj)
}

export function checkVoucherDetail (getState, dispatch) {
  const globalState = getState()
  const { billingStatus } = globalState.uretailHeader.toJS()
  const lineConnection = globalState.offLine.get('lineConnection');
  const goCash = !!((cb.rest.interMode === 'touch' && !lineConnection)); /* 走断网 */
  let canOpen = true
  if (billingStatus != 'PresellBill') {
    const products = globalState.product.toJS().products;
    const rows = []; let bSuccess = true; let bSameWareHouse = true; let iWarehouseid = null;
    products.forEach((product, index) => {
      const check = checkRow(product, globalState, goCash);
      if (check == false) {
        bSuccess = false;
        rows.push(product);
        if (rows.length < 2)
          dispatch(setFocusedRow(product, index));
      } else {
        if (billingStatus == 'OnlineBill' || billingStatus == 'OnlineBackBill') {
          if (iWarehouseid == null) {
            iWarehouseid = product.iWarehouseid;
          } else {
            if (iWarehouseid != product.iWarehouseid) {
              bSameWareHouse = false;
              cb.utils.alert('电商/电商退货状态下，表体行仓库必须一致！', 'error');
            }
          }
        }
      }
    });
    if (!bSuccess && !goCash) {
      dispatch(genAction('PLATFORM_UI_BILLING_SET_COMMON_DATA', {
        bCheckDetail: true,
        checkedRows: rows,
        rowData: rows[0]
      }));
      dispatch(showModal('EditRow'));
    }
    if (!bSameWareHouse) return bSameWareHouse;
    canOpen = bSuccess
  }
  /* lz canOpen放入obj */
  const obj = {canOpen}
  afterCheckDetail(obj);
  canOpen = obj.canOpen
  return canOpen
}

export function showEdit (bCheckDetail, checkedRows) {
  return function (dispatch, getState) {
    dispatch(genAction('PLATFORM_UI_BILLING_SET_COMMON_DATA', {
      bCheckDetail: bCheckDetail,
      checkedRows: checkedRows,
      rowData: checkedRows[0]
    }));
    dispatch(showModal('EditRow'));
  }
}

export function cancelCheck () {
  return function (dispatch) {
    bRefReturn = false;
    dispatch(genAction('PLATFORM_UI_BILLING_SET_COMMON_DATA', {
      bCheckDetail: false, checkedRows: []
    }));
  }
}

export function canOpenEdit (dispatch, globalState, callback) {
  let focusedRow = globalState.product.get('focusedRow');
  if (Immutable.Map.isMap(focusedRow)) focusedRow = focusedRow.toJS();

  const { checkedRows } = globalState.editRow.toJS();
  if (focusedRow.bFixedCombo && focusedRow.children) {
    cb.utils.alert('当前行不允许改行！', 'error');
    return
  }
  if (focusedRow.noModify) {
    cb.utils.alert('原单退货中，换货行不允许改行！', 'error');
    return
  }
  if (!checkedRows || checkedRows.length == 0) {
    dispatch(genAction('PLATFORM_UI_BILLING_SET_COMMON_DATA', { bCheckDetail: false, checkedRows: [] }));
  }

  callback();
}

/* 有效期至 反算生产日期 /生产日期 反算有效期至 */
export function checkInvaliddate (date, key) {
  return function (dispatch, getState) {
    const rowData = getState().editRow.toJS().rowData;
    const products = getState().product.get('products').toJS();
    const data = getRetailVoucherData(getState());
    const item = {
      location: 0, key: key, childrenField: 'retailVouchDetails', value: date,
      type: 'DatePicker', fieldname: key
    };
    for (var i = 0; i < products.length; i++) {
      if (rowData.key == products[i].key) {
        item.location = i;
        break;
      }
    }
    const config = {
      url: 'bill/check',
      method: 'POST',
      params: {
        billnum: 'rm_retailvouch',
        data: JSON.stringify(data),
        item: JSON.stringify(item),
      }
    };
    proxy(config)
      .then(function (json) {
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error');
          return
        }
        const row = json.data;
        rowData[key] = date;
        if (row) {
          if (key == 'invaliddate') {
            rowData.producedate = row.producedate;
          } else {
            rowData.invaliddate = row.invaliddate;
          }
        } else {
          cb.utils.alert('计算效期/生产日期失败', 'error');
        }
        dispatch(genAction('PLATFORM_UI_BILLING_EDITROW_SET_ROWDATA', rowData))
      });
  }
}
/* 获取序列号参照数据 */
export function getSnData (iWarehouseid) {
  return function (dispatch, getState) {
    const row = getState().editRow.toJS().rowData;
    const data = getRetailVoucherData(getState());
    if (iWarehouseid)
      row.iWarehouseid = iWarehouseid;
    if (row.cBatchno == '') row.cBatchno = null;
    if (row.goodsposition == '') row.goodsposition = null;
    data.retailVouchDetails = [row];
    const config = {
      url: 'bill/ref/getRefData',
      method: 'POST',
      params: {
        page:
          { pageSize: 1000, pageIndex: 1 },
        refCode: 'sn_snref',
        billnum: 'rm_retailvouch',
        key: 'sn',
        dataType: 'grid',
        data: JSON.stringify(data),
        goodsposition: row.goodsposition
      },
    };
    proxy(config)
      .then(function (json) {
        if (json.code != 200) {
          cb.utils.alert(json.message, 'error');
          return
        }
        dispatch(genAction('PLATFORM_UI_BILLING_EDITROW_GET_SN_DATASOURCE', json.data.recordList))
      });
  }
}

const onOpenEditRow = (row = {}) => {
  const billingViewModel = getBillingViewModel()
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('onOpenEditRow', { row: row })
}

/* mobile */
export function showSalesList () {
  return function (dispatch, getState) {
    if (!canOpenEmplyee(getState())) return;
    const { salesList, checkedRow } = getState().salesClerk.toJS();
    const referData = {
      dataSource: salesList,
      title: '选择营业员',
      reduxName: 'SALESCLERK',
      returnType: 'salesClerk',
      defineName: null,
      showType: 'operator',
      checkedRow: {
        compareItem: 'id',
        row: [checkedRow.id],
      },

      showItem: {
        cItemName: 'name',
        imgItemName: 'cHeadPicUrl',
        childrenItem: []
      }
    };
    dispatch(genAction('BILLING_REFER_INIT_DATA', referData));
    if (cb.rest.AppContext.option.retailMustChooseEmployee)
      dispatch(genAction('PLATFORM_UI_BILLING_SALES_SET_COMMON_DATA', { hasShow: true }))
    return true;
  }
}
/* 批号 */
export function befoeBatchRefer () {
  return function (dispatch, getState) {
    const { Batch_DataSource } = getState().editRow.toJS();
    const referData = {
      dataSource: Batch_DataSource,
      title: '选择批号',
      reduxName: 'EDITROW_BATCHNO',
      returnType: null,
      defineName: null,
      showType: 'batchno',
      showItem: {
        cItemName: 'batchno',
        childrenItem: []
      }
    };
    dispatch(genAction('BILLING_REFER_INIT_DATA', referData));
  }
}
/* 序列号 */
export function befoeSNRefer () {
  return function (dispatch, getState) {
    const { SN_DataSource } = getState().editRow.toJS();
    const referData = {
      dataSource: SN_DataSource,
      title: '选择序列号',
      reduxName: 'EDITROW_SN',
      returnType: null,
      defineName: null,
      showType: 'sn',
      showItem: {
        cItemName: 'sn',
        childrenItem: []
      }
    };
    dispatch(genAction('BILLING_REFER_INIT_DATA', referData));
  }
}
/* 仓库 */
export function beforeWareHouseRefer () {
  return function (dispatch, getState) {
    const { WareHouse_DataSource, rowData } = getState().editRow.toJS();
    const referData = {
      dataSource: WareHouse_DataSource,
      title: '选择仓库',
      reduxName: 'EDITROW_WAREHOUSE',
      returnType: 'editRow-warehouse',
      defineName: null,
      showType: 'warehouse',
      checkedRow: {
        compareItem: 'warehouse',
        row: [rowData.iWarehouseid],
      },
      showItem: {
        cItemName: 'warehouse_name',
        childrenItem: []
      }
    };
    dispatch(genAction('BILLING_REFER_INIT_DATA', referData));
  }
}
/** 切换门店 **/
export function beforeUserStoreRefer () {
  return function (dispatch, getState) {
    const { userStores, storeId } = getState().user.toJS();
    const referData = {
      dataSource: userStores,
      title: '选择门店',
      reduxName: 'CHANGESTORE',
      returnType: null,
      defineName: null,
      showType: 'store',
      showSearch: true,
      searchSource: 'store_name',
      placeholder: '门店名称',
      checkedRow: {
        compareItem: 'store',
        row: [storeId],
      },
      showItem: {
        cItemName: 'store_name',
        childrenItem: []
      }
    };
    dispatch(genAction('BILLING_REFER_INIT_DATA', referData));
  }
}

/* 已经执行过优惠，不允许 */
export function hasPreferential (allState, name) {
  let money = allState.product.get('money');
  Immutable.Map.isMap(money) && (money = money.toJS());
  const { Member, Scene, Promotion, Coupon, Point } = money;
  if (Member.value > 0 || Scene.done || Promotion.done || Coupon.done || Point.done) {
    cb.utils.alert(name, 'error')
    return true
  }
  return false
}

/* 货位 */
export function getGoodsPositionData (rowData) {
  return function (dispatch, getState) {
    const billingStatus = getState().uretailHeader.get('billingStatus');
    const { iWarehouseid, product, productsku, fQuantity, cSerialNo, cBatchno, product_productOfflineRetail_isSerialNoManage, product_productOfflineRetail_isBatchManage } = rowData
    const config = {
      url: 'goodsposition/getGoodsPositionByWare',
      method: 'POST',
      params: {
        warehouse: iWarehouseid,
        product,
        productsku,
        fQuantity,
        cSerialNo,
        cBatchno,
        product_productOfflineRetail_isBatchManage,
        product_productOfflineRetail_isSerialNoManage,
        billingStatus
      }
    }
    proxy(config).then(json => {
      if (json.code !== 200) {
        cb.utils.alert(json.message, 'error')
        return
      }
      // json.data =  [{id: 123, name: '拉萨的肌肤', code: '234'},{id: 1234, name: '拉萨的肌肤sfs', code: '234'}, {id: 1235, name: '拉萨的肌肤htrtr', code: '234'}]
      dispatch(genAction('PLATFORM_UI_BILLING_SET_COMMON_DATA', { goodsPositionData: json.data }))
    })
  }
}

export function getEditRowModel () {
  return editRowModel;
}
