import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { get_skuTab_goodsColumns } from './goodsRefer'

let goodsMap = {};
const initialState = {
  recordCount: 0,
  treeData: [],
  pageIndex: 1,
  treePath: '',
  selectedGoodsRowKeys: [], // sku页签选中key
  goodsTab_goodsData: [],
  goodsTab_goodsColumns: [],
}

const $$initialState = Immutable.fromJS(initialState);
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_GOODS_REFER_FLAT_GOODS_SET_OPTIONS':
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_GOODS_REFER_FLAT_GOODS_CLEAR':
      return action.payload;
    default:
      return $$state
  }
}

function init_goodsMap (tableData) {
  if (!tableData) return
  tableData.recordList.forEach(product => {
    const goodsKey = product.id;
    goodsMap[goodsKey] = product
  })
}

// function get_goodsTab_goodsColumns() {
//     return [{ title: '编码', dataIndex: 'code', key: '编码', width: 137, className: 'sku_code' },
//     { title: '名称', dataIndex: 'name', key: '名称', width: 296, className: 'sku_name' },
//     { title: '品牌', dataIndex: 'brandName', key: '品牌', width: 139, className: 'sku_brand' },
//     { title: '零售价', dataIndex: 'salePrice', className: 'sku_price columns-right', key: '零售价', width: 141 },
//     ];
// }

function get_goodsTab_goodsData (tableData) {
  if (!tableData) return;
  const goodsTab_goodsData = [];
  tableData.recordList.forEach(function (element) {
    let item = {};
    // for(let i=0;i<columns.length;i++){
    //     item[columns[i].dataIndex]=element[columns[i].key]
    // };
    item = element;
    item.code = element.cCode;
    item.name = element.cName;
    item.brandName = element.brandName;
    item.salePrice = element.salePrice !== undefined && element.salePrice.toFixed(2);
    item.key = `${element.id}`;
    if (element.skuId) item.skuId = element.skuId;
    item.productskus = element.productskus;
    item.ppath = element.ppath;
    goodsTab_goodsData.push(item);
  }, this)
  return goodsTab_goodsData;
}

export function goodsOnSelect (type, value) {
  return function (dispatch, getState) {
    const selectedGoodsRowKeys = getState().flatGoods.toJS().selectedGoodsRowKeys;
    if (type === 'push') {
      selectedGoodsRowKeys.push(value)
    } else {
      const index = selectedGoodsRowKeys.indexOf(value);
      if(index != -1) selectedGoodsRowKeys.splice(index, 1)
    }
    dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_GOODS_SET_OPTIONS', { selectedGoodsRowKeys }))
  }
}

export function setOptions (obj) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_GOODS_SET_OPTIONS', obj))
  }
}

// 商品页签的服务
export function getFlatGoodsData (needTree, selectedKeys, options, keyword) {
  return async function (dispatch, getState) {
    // let promotionFilter = getState().product.toJS().promotionFilter;
    const keyWord = keyword != undefined ? keyword : getState().goodsRefer.toJS().referKeyword;
    let path = selectedKeys ? selectedKeys[0] : getState().flatGoods.toJS().treePath;
    if(path === '0') path = '';
    if(options) { // 有分页
      dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_GOODS_SET_OPTIONS', {pageIndex: options.pageIndex, treePath: path, keyWord}))
    }else{
      dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_GOODS_SET_OPTIONS', {pageIndex: 1, treePath: path, keyWord}))
    }
    const json = await getProxy(needTree, path, keyWord, options);
    if(json.code == 200 ) {
      const goodsTabInit = getState().goodsRefer.toJS().goodsTabInit;
      if(goodsTabInit)
        dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', {goodsTabInit: false}))
      /* 更新tab标签下的table数据 */
      init_goodsMap(json.data.gridData);
      if(json.data.treeData) {
        dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_GOODS_SET_OPTIONS', {treeData: json.data.treeData}))
      }
      const goodsTab_goodsData = get_goodsTab_goodsData(json.data.gridData);
      const goodsTab_goodsColumns = get_skuTab_goodsColumns(getState);
      const recordCount = json.data.gridData.recordCount || 0;
      dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_GOODS_SET_OPTIONS', {goodsTab_goodsData, goodsTab_goodsColumns, recordCount}))
    }else{
      cb.utils.alert(json.message, 'error')
    }
  }
}

const getProxy = async function (needTree, filterPath, keyWord, options) {
  const gridDataUrl = {
    url: 'mall/bill/ref/getRefProductsWithoutSku',
    method: 'POST',
  };
  if (!options || !options.pageIndex) { // 全部数据或者有path过滤条件的全部数据
    gridDataUrl.params = {
      externalData: {
        needTree: needTree,
        keyWord: keyWord || '',
      },
      path: filterPath,
    };
  } else { // 有path过滤和没path过滤的分页数据
    gridDataUrl.params = {
      externalData: {
        needTree: needTree,
        keyWord: keyWord || '',
      },
      page: { pageIndex: options.pageIndex, pageSize: 8 },
      path: filterPath,
    }
  }
  const json = await proxy(gridDataUrl);
  return json
}

// flat型sku页签数据导出
export function flatGoodsExport (allState) {
  const selectedGoodsRowKeys = allState.flatGoods.toJS().selectedGoodsRowKeys;
  const arr = [];
  for (const attr in goodsMap) {
    const index = selectedGoodsRowKeys.indexOf(attr)
    if (index != -1)
      arr.push(goodsMap[attr])
  }
  return arr
}

export function goodsClear () {
  return function (dispatch) {
    goodsMap = {};
    const state = Immutable.fromJS(initialState);
    dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_GOODS_CLEAR', state))
  }
}
