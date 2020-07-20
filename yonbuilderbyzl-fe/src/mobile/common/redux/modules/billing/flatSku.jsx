import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';

let skuMap = {};
const initialState = {
  recordCount: 0,
  treeData: [],
  pageIndex: 1,
  treePath: '',
  selectedGoodsRowKeys: [], // sku页签选中key
  skuTab_goodsData: [],
  skuTab_goodsColumns: [],
}

const $$initialState = Immutable.fromJS(initialState);
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_GOODS_REFER_FLAT_SKU_SET_OPTIONS':
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_GOODS_REFER_FLAT_SKU_INIT_DATASOURCE': {
      const all = initSkuDataSource(action.payload);
      return $$state.merge(all)
    }
    case 'PLATFORM_UI_GOODS_REFER_FLAT_SKU_CLEAR':
      return action.payload;
    default:
      return $$state
  }
}

const initSkuDataSource = (json) => {
  const treeData = json.data.treeData;
  const tableData = json.data.gridData;
  const recordCount = tableData.recordCount;
  init_skuMap(tableData);
  const skuTab_goodsData = get_skuTab_goodsData(tableData);
  const skuTab_goodsColumns = get_skuTab_goodsColumns()
  // dispatch(genAction('PLATFORM_UI_GOODS_REFER_SAVE_TREE_DATA', {
  //     treeData: treeData, tableData, skuTab_goodsData, skuTab_goodsColumns, skuTabInit:false,
  //     goodsTab_treeData:treeData, goodsTab_totalCount:tableData.recordCount, goodsTab_goodsData:skuTab_goodsData, goodsTab_goodsColumns:skuTab_goodsColumns, goodsTabInit: false }));
  // }
  return { treeData, recordCount, skuTab_goodsData, skuTab_goodsColumns }
}

function init_skuMap (tableData) {
  if (!tableData) return
  tableData.recordList.forEach(product => {
    const goodsKey = `${product.id}|${product.skuId}`;
    product.skuKey = goodsKey;
    skuMap[goodsKey] = product
  })
}

function get_skuTab_goodsColumns () {
  return [{ title: '编码', dataIndex: 'code', key: '编码', width: 180, className: 'sku_code' },
    { title: 'SKU编码', dataIndex: 'skuCode', width: 180},
    { title: 'SKU名称', dataIndex: 'productskus_skuName', width: 296},
    { title: '品牌', dataIndex: 'brandName', key: '品牌', width: 139, className: 'sku_brand' },
    { title: '零售价', dataIndex: 'salePrice', className: 'sku_price columns-right', key: '零售价', width: 141 },
  ];
}

function get_skuTab_goodsData (tableData) {
  if (!tableData) return;
  const skuTab_goodsData = [];
  tableData.recordList.forEach(function (element) {
    const item = {};
    // for(let i=0;i<columns.length;i++){
    //     item[columns[i].dataIndex]=element[columns[i].key]
    // };
    item.code = element.cCode;
    // item.name = element.cName;
    item.brandName = element.brandName;
    item.salePrice = element.skuSalePrice.toFixed(2);
    item.key = `${element.id}|${element.skuId}`;
    if (element.skuId) item.skuId = element.skuId;
    item.productskus = element.productskus;
    item.ppath = element.ppath;
    item.productskus_skuName = element.productskus_skuName;
    item.skuCode = element.skuCode;
    skuTab_goodsData.push(item);
  }, this)
  return skuTab_goodsData;
}

export function skuOnSelect (type, value) {
  return function (dispatch, getState) {
    const selectedGoodsRowKeys = getState().flatSku.toJS().selectedGoodsRowKeys;
    if (type === 'push') {
      selectedGoodsRowKeys.push(value)
    } else {
      const index = selectedGoodsRowKeys.indexOf(value);
      if(index != -1) selectedGoodsRowKeys.splice(index, 1)
    }
    dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_SKU_SET_OPTIONS', { selectedGoodsRowKeys }))
  }
}

export function setOptions (obj) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_SKU_SET_OPTIONS', obj))
  }
}

// 左树的过滤
export function sku_getFilterData (selectedKeys, options, keyword) {
  return async function (dispatch, getState) {
    const promotionFilter = getState().product.toJS().promotionFilter;
    const keyWord = keyword != undefined ? keyword : getState().goodsRefer.toJS().referKeyword;
    let path = selectedKeys ? selectedKeys[0] : getState().flatSku.toJS().treePath;
    if(path === '0') path = '';
    if(options) { // 有分页
      dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_SKU_SET_OPTIONS', {pageIndex: options.pageIndex, treePath: path, keyWord}))
    }else{
      dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_SKU_SET_OPTIONS', {pageIndex: 1, treePath: path, keyWord}))
    }
    const json = await getProxy(promotionFilter, path, 1, keyWord, options);
    if(json.code == 200 ) {
      init_skuMap(json.data.gridData);
      const skuTab_goodsData = get_skuTab_goodsData(json.data.gridData)
      dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_SKU_SET_OPTIONS', {skuTab_goodsData, recordCount: json.data.gridData ? json.data.gridData.recordCount : 0}))
    }else{
      cb.utils.alert(json.message, 'error')
    }
  }
}

const getProxy = async function (promotionFilter, filterPath, queryType, keyWord, options) {
  const gridDataUrl = {
    url: 'mall/bill/ref/getRefProducts',
    method: 'POST',
  };
  if (!options || !options.pageIndex) { // 全部数据或者有path过滤条件的全部数据
    gridDataUrl.params = {
      externalData: { giftProductIds: promotionFilter, showType: 'Y' },
      path: filterPath,
      keyWord: keyWord || '',
      queryType: queryType
    };
  } else { // 有path过滤和没path过滤的分页数据
    gridDataUrl.params = {
      externalData: { giftProductIds: promotionFilter, showType: 'Y' },
      page: { pageIndex: options.pageIndex, pageSize: 8 },
      path: filterPath,
      keyWord: keyWord || '',
      queryType: queryType
    }
  }
  const json = await proxy(gridDataUrl);
  return json
}

// flat型sku页签数据导出
export function flatSkuExport (allState) {
  const selectedGoodsRowKeys = allState.flatSku.toJS().selectedGoodsRowKeys;
  const arr = [];
  for (const attr in skuMap) {
    const index = selectedGoodsRowKeys.indexOf(attr)
    if (index != -1)
      arr.push(skuMap[attr])
  }
  return arr
}

export function initSku (treeData, tableData) {
  return function (dispatch) {
    init_skuMap(tableData);
    const skuTab_goodsData = get_skuTab_goodsData(tableData);
    const skuTab_goodsColumns = get_skuTab_goodsColumns();
    const recordCount = tableData.recordCount;
    dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_SKU_SET_OPTIONS', {skuTab_goodsData, skuTab_goodsColumns, recordCount, treeData}))
  }
}

export function skuClear () {
  return function (dispatch) {
    skuMap = {};
    const state = Immutable.fromJS(initialState);
    dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_SKU_CLEAR', state))
  }
}
