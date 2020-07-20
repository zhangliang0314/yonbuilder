import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import { dealReferReturnProducts } from './product';
import { flatSkuExport, initSku, skuClear } from './flatSku';
import { flatGoodsExport, goodsClear } from './flatGoods';
import { getBillingViewModel } from './config';

var allselectedState = {};
// selectedExpandedKeys[productId] = {selected:[], data:{}, skus:{},length:sku.length};
// selectedExpandedKeys[productId].items.push(sku);

var allselectedState_combo = {};
// allselectedState_combo[comboId]={item}
// item[productId] = {selected:[], data:{}, skus:{}};

var allselectedState_goods = {};

// const products = [];
// for (var attr in selectedExpandedKeys) {
//   var goods = selectedExpandedKeys[attr];
//   goods.items.forEach(item=>{
//     products.push(Object.assign({}, goods.data, item));
//   })
// }
var columnsRender = {};
let isTable = false;
const initialState = {
  isTable: false,
  focus: false,
  refCode: null,
  visible: false,
  tabName: 'sku',
  skuColumnsArr: [], // 打开过的sku的columns的集合  clear
  scanKeyword: '', // 扫码关键字 过滤服务的过滤条件
  referKeyword: '', // 参照内关键字
  /* sku页签 */
  skuTabInit: true,
  gridMeta: null,
  treeData: [],
  tableData: null,
  skuTab_goodsData: null, // sku页签下的goodsTable的data clear
  skuTab_goodsColumns: null, // sku页签下的goodsTable的栏目数据 clear
  skuTab_skuData: [],
  skuTab_skuColumns: [],
  treeValue: [], // 树的显示  clear
  currentPage: 1, // 当前页    clear && 每次getGridData clear
  selectedRowKeys: [], // sku选中的行的key集合  clear
  selectedGoodsRowKeys: [], // goods选中的行的key集合 clear
  skuTab_expandedRowKeys: [], // goods的展开行 clear
  skuIsHaveColumn: true, // sku中有无columns数据 clear
  /** **************************************************套餐页签（combo）********************************************/
  comboTabInit: true, // combo标签是否允许取数据和初始化 clear
  comboTab_treeData: null,
  comboTab_totalCount: 0, // 分页的recordCount
  comboTab_goodsData: null, // 固定套餐下的主表数据  //clear
  comboTab_goodsColumns: null, // 固定套餐下的主表栏目 //clear
  comboTab_skuData: [], // 固定套餐下的字表数据 clear
  comboTab_skuColumns: [], // 固定套餐下的字表栏目 clear
  comboId: null, // 当前套餐的主键  也作为path当做过滤条件 clear
  comboTab_selectedGoodsKeys: [], // 主表的选中状态
  comboTab_selectedSkuKeys: [], // 字表的选中状态
  comboTab_expandedRowKeys: [], // goods的展开行 clear
  comboTab_params: {}, // 固定套餐服务的参数  clear
  comboTab_currentPage: 1,
  comboTab_copyData: {}, // allselectedState_combo的copy
  comboChecked: [], // 套餐的选中
  /** ***************************************************商品页签*****************************************************/
  goodsTab_selectedKeys: [], // 商品页签选中行clear
  goodsTabInit: true, // 商品标签标签是否允许取数据和初始化 clear
  goodsTab_treeData: [], // 左树clear
  goodsTab_totalCount: null, // 总条数 clear
  goodsTab_goodsData: [], // antd的表数据clear
  goodsTab_goodsColumns: [], // antd的表栏目clear
  goodsTab_currentPage: 1, // clear
  goodsTab_treeValue: [], // 数的path  clear
  goodsTab_allSelected: 'allUnchecked', // 全选按钮的选中 clear
}
const $$initialState = Immutable.fromJS(initialState);
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_GOODS_REFER_SET_OPTIONS':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_GOODS_REFER_DEAL_DATA':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_GOODS_REFER_DATA_IS_TREE_OR_TABLE':
      isTable = true;
      return $$state.merge({ isTable: true })
    case 'PLATFORM_UI_GOODS_REFER_GET_SERVICE_URL':
      return $$state.mergeDeepIn([], { serviceUrl: action.payload.proxyConfig, gridMeta: action.payload.gridMeta });
    case 'PLATFORM_UI_GOODS_REFER_SAVE_TREE_DATA':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_GOODS_REFER_SAVE_TABLE_DATA':
      return $$state.merge({ tableData: action.payload });
    case 'PLATFORM_UI_GOODS_REFER_CLEAR_PAGE':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_GOODS_REFER_GOODS_SKU_HANDLE':
      return $$state.merge(action.payload);
    case 'PLATFORM_UI_GOODS_REFER_SAVE_SKU_COLUMNS':
      return $$state.updateIn(['skuColumnsArr'], list => list.push(action.payload));
    case 'PLATFORM_UI_GOODS_REFER_GOODS_NO_SKU':
      return $$state.merge({ selectedRowKeys: action.payload });
    case 'PLATFORM_UI_GOODS_REFER_CLEAR_REDUX':
      return $$initialState.merge({ masterColumns: $$state.get('masterColumns') });
    case 'PLATFORM_UI_BILLING_CLEAR':
      return $$state.merge({ referKeyword: '', scanKeyword: '' })
    default:
      return $$state;
  }
}

export function setSearchBoxFocus (focus) {
  return genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { focus });
}

export function setOptions (value) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', value));
  }
}

export function getRefData (options) {
  return function (dispatch, getState) {
    const promotionFilter = getState().product.toJS().promotionFilter;
    const referKeyword = getState().goodsRefer.get('referKeyword');
    const config = {
      url: 'mall/bill/ref/getProductRefData.do',
      method: 'POST',
      params: {
        externalData: { giftProductIds: promotionFilter, showType: isTable ? 'Y' : 'N' }
      }
    }
    proxy(config)
      .then(json => {
        if (json.code === 200) {
          if (isTable === true) {
            dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_SKU_INIT_DATASOURCE', json));
            dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { skuTabInit: false }));
          } else {
            const treeData = json.data.treeData;
            const skuTab_goodsColumns = get_skuTab_goodsColumns(getState)
            /* modify  搜索框有值 不在重新赋table */
            if (cb.utils.isEmpty(referKeyword)) {
              const tableData = json.data.gridData;
              init_allselectedState(tableData);
              init_allselectedState_goods(tableData);
              const skuTab_goodsData = get_skuTab_goodsData(tableData);
              dispatch(genAction('PLATFORM_UI_GOODS_REFER_SAVE_TREE_DATA', {
                treeData: treeData, tableData, skuTab_goodsData, skuTab_goodsColumns, skuTabInit: false,
                goodsTab_treeData: treeData, goodsTab_totalCount: tableData.recordCount, goodsTab_goodsData: skuTab_goodsData, goodsTab_goodsColumns: skuTab_goodsColumns, goodsTabInit: false
              }));
            } else {
              dispatch(genAction('PLATFORM_UI_GOODS_REFER_SAVE_TREE_DATA', {
                treeData: treeData, skuTab_goodsColumns, skuTabInit: false,
                goodsTab_treeData: treeData, goodsTab_goodsColumns: skuTab_goodsColumns, goodsTabInit: false
              }));
            }
          }
        }
        if (json.code !== 200) {

        }
      });
  }
}
function init_allselectedState (tableData) {
  if (!tableData) return;
  tableData.recordList.map((value) => { // 自定义更改skuData的skuKey goodsId+'|'+skuId
    const goodsId = value.id;
    /* 已初始化的数据仍初始化 */
    // allselectedState[goodsId] = { selected: [], data: value, skus: {} };
    /* 全部和某一分类树有同一商品并且选中 bug⬆️ */
    if (allselectedState[goodsId])
      allselectedState[goodsId].data = value;
    else
      allselectedState[goodsId] = { selected: [], data: value, skus: {} };
    if (value.productskus.length > 0) {
      return value.productskus.map((item) => {
        item.skuKey = goodsId + '|' + item.skuId;
        allselectedState[goodsId].skus[item.skuId] = item;
      })
    }
  })
}
function init_allselectedState_goods (tableData) {
  if (!tableData) return;
  tableData.recordList.forEach(value => {
    const goodsId = value.id;
    /* 已初始化的数据仍初始化 */
    allselectedState_goods[goodsId] = { data: value, skus: value.productskus }
  })
}
function get_skuTab_goodsData (tableData) {
  if (!tableData) return;
  const skuTab_goodsData = [];
  tableData.recordList.forEach(function (element) {
    let item = {};
    // for(let i=0;i<columns.length;i++){
    //     item[columns[i].dataIndex]=element[columns[i].key]
    // };
    item = element;
    item.code = element.cCode;
    item.name = element.cName;
    item.brandName = element.brandName;
    item.salePrice = element.salePrice !== undefined ? element.salePrice.toFixed(2) : '';
    item.key = element.id;
    if (element.skuId) item.skuId = element.skuId;
    item.productskus = element.productskus;
    item.ppath = element.ppath;
    skuTab_goodsData.push(item);
  }, this)
  return skuTab_goodsData;
}
export function get_skuTab_goodsColumns (allState) {
  const masterColumns = allState().goodsRefer.toJS().masterColumns;
  const arr = [];
  masterColumns.forEach(item => {
    const column = {
      title: item.cShowCaption,
      dataIndex: item.cItemName,
      key: item.cShowCaption,
      width: item.iColWidth,
      className: `sku_${item.cItemName}`
    }
    arr.push(column)
  })
  return arr
  // return [{ title: '编码', dataIndex: 'code', key: '编码', width: 137, className: 'sku_code' },
  //       { title: '名称', dataIndex: 'name', key: '名称', width: 276, className: 'sku_name'},
  //       { title: '规格类型', dataIndex: 'tttt', key: '规格类型', width: 80, className: 'sku_brand' },
  //       { title: '品牌', dataIndex: 'brandName', key: '品牌', width: 79, className: 'sku_brand' },
  //       { title: '零售价', dataIndex: 'salePrice', className: 'sku_price columns-right', key: '零售价', width: 141 },
  //     ];
}
export function changeTabFetchData (Tab) {
  return function (dispatch, getState) {
    /* 处理商品和套餐页签第一次时候的取数据和初始化 */
    if (Tab === '固定套餐') {
      const options = getState().goodsRefer.toJS().comboTab_params;
      const config = {
        url: 'mall/bill/ref/getCombineSales.do',
        method: 'GET',
        params: {
          storeId: options.storeId,
          billDate: options.date,
          memberLevelId: options.levelCode,
        }
      }
      proxy(config)
        .then(json => {
          if (json.code === 200) {
            const comboTab_totalCount = json.data.recordCount;
            const comboTab_showData = init_combo(json.data.recordList);
            dispatch(genAction('PLATFORM_UI_GOODS_REFER_DEAL_DATA', comboTab_showData))
            dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { comboTabInit: false, comboTab_totalCount }));
          }
          if (json.code !== 200) {

          }
        });
    }
    if (Tab === 'sku' || Tab === '商品') {
      dispatch(getRefData())
    }
  }
}
/* 初始化，套餐页签的展现数据 */
function init_combo (data) {
  data = translateComboService(data)
  const comboTab_treeData = []; const comboTab_goodsData = []; let comboId;
  if (data.length > 0) {
    data.forEach((element) => {
      const ele = {};
      ele.id = element.id;
      ele.name = element.name;
      comboTab_treeData.push(ele);
      if (!comboId) comboId = element.id;
      if (!allselectedState_combo[element.id]) { // 没有初始化过的套餐
        allselectedState_combo[element.id] = { selected: [], data: element, };
        if (element.combinationProducts) {
          element.combinationProducts.forEach((obj) => {
            const comboObj = allselectedState_combo[element.id];
            obj.goodsKey = element.id + '|' + obj.id;
            comboObj[obj.goodsKey] = { selected: [], data: obj, skus: {} };
            obj.product_productskus.forEach((val) => {
              val.skuKey = val.product + '|' + val.skuId;
              const goodsId = element.id + '|' + obj.id;
              comboObj[goodsId].skus[val.skuKey] = val;
              /* 定位到sku的直接放入到selected */
              if (val.productNum) {
                comboObj[obj.goodsKey].selected.push(val.skuKey);
                allselectedState_combo[element.id].selected.push(obj.goodsKey)
              }
            })
          })
        }
      }
    });
  }
  const comboTab_copyData = cb.utils.extend(true, {}, allselectedState_combo);
  /* 主表栏目 */
  const comboTab_goodsColumns = [
    { title: '编码', dataIndex: 'code', key: '编码', width: 114, className: 'combo_code' },
    { title: '名称', dataIndex: 'name', key: '名称', width: 250, className: 'combo_name' },
    { title: '数量', dataIndex: 'productTotalNum', key: '数量', width: 115, className: 'combo_num' },
    { title: '零售价', dataIndex: 'salePrice', className: 'combo_price columns-right', key: '零售价', width: 117 },
    { title: '套餐价', dataIndex: 'favorablePrice', className: 'combo_comboPrice columns-right', key: '套餐价', width: 117 },
  ];
  /* 服务数据转成antd主表数据(默认第一个套餐的数据) */
  if (!allselectedState_combo[comboId]) return { comboTab_treeData, comboTab_goodsData, comboId, comboTab_goodsColumns, comboTab_copyData }
  const combinationProducts = allselectedState_combo[comboId].data.combinationProducts ? allselectedState_combo[comboId].data.combinationProducts : []
  combinationProducts.forEach(item => {
    const ele = {};
    ele.code = item.cCode;
    ele.name = item.cName;
    ele.productTotalNum = item.productTotalNum;
    ele.salePrice = item.salePrice.toFixed(2);
    ele.favorablePrice = item.favorablePrice ? (item.favorablePrice / item.productTotalNum).toFixed(2) : '';
    ele.key = item.goodsKey;
    ele.product_productskus = item.product_productskus;
    comboTab_goodsData.push(ele);
  })
  return { comboTab_treeData, comboTab_goodsData, comboId, comboTab_goodsColumns, comboTab_copyData }
}

/* 套餐单sku，sku取商品数量 */
const translateComboService = (data) => {
  if (!data.length) return data
  data.forEach(combo => {
    combo.combinationProducts && combo.combinationProducts.forEach(goods => {
      if (goods.product_productskus && goods.product_productskus.length == 1)
        goods.product_productskus[0].productNum = goods.productNum
    })
  })
  return data
}

export function getSkuColumnsOrData (tabName, rowKey) {
  return function (dispatch, getState) {
    const { comboId, skuColumnsArr } = getState().goodsRefer.toJS();
    if (tabName === '固定套餐') {
      /* 取字表sku数据 */
      const comboTab_skuData = []; let comboTab_skuColumns = [];
      let combo_isFetch = true;
      const combo_goodsId = rowKey.split('|')[1];
      if (!allselectedState_combo[comboId]) return;
      skuColumnsArr.forEach(item => {
        if (item.rowKey == rowKey) {
          comboTab_skuColumns = item.data;
          /* comboId 与 rowKey 不是同一套餐 */
          if (!allselectedState_combo[comboId][rowKey]) {
            combo_isFetch = false;
            return;
          }
          allselectedState_combo[comboId][rowKey].data.product_productskus.forEach(element => {
            const ele = {};
            comboTab_skuColumns.forEach(item => {
              ele[item.dataIndex] = element[item.dataIndex];
            })
            ele.key = element.skuKey
            comboTab_skuData.push(ele);
          });
          dispatch(genAction('PLATFORM_UI_GOODS_REFER_DEAL_DATA', { comboTab_skuData, comboTab_skuColumns }));
          combo_isFetch = false;
        }
      });
      if (combo_isFetch) {
        const columnsArr = []; let concatArr;
        const config = {
          url: 'mall/bill/ref/getSkuShowItem.do',
          method: 'GET',
          params: {
            productId: combo_goodsId,
          }
        }
        proxy(config)
          .then(json => {
            if (json.code === 200) {
              json.data.forEach(element => {
                const ele = {};
                if (element.cFreeid > 10) {
                  ele.title = element.cName;
                  // ele.dataIndex = 'propertiesValue';
                  ele.dataIndex = element.key
                  ele.width = 500;
                } else {
                  ele.title = element.cName;
                  ele.dataIndex = 'free' + element.cFreeid;
                  ele.width = element.width || 100;
                }
                columnsArr.push(ele);
              })
              const headArr = [
                { title: '', dataIndex: `${tabName}_kong`, fixed: 'left', width: 1 },
                { title: '编码', dataIndex: 'skuCode', width: 150 }, ];
              const footerArr = [
                { title: '数量', dataIndex: 'productNum', render: columnsRender.fQuantity, width: 100 },
                { title: '零售价', dataIndex: 'skuSalePrice', className: 'columns-right', width: 100 },
                { title: '套餐价', dataIndex: 'favorablePrice', className: 'columns-right', width: 100 }, ]
              const copyArr = concatArr = headArr.concat(columnsArr).concat(footerArr);
              const product_goods = allselectedState_combo[comboId][rowKey].data;
              allselectedState_combo[comboId][rowKey].data.product_productskus.forEach(element => {
                const ele = {};
                concatArr.forEach((item, index) => {
                  if (item.dataIndex == 'productNum') {
                    if (element[item.dataIndex]) {
                      copyArr[index] = { title: '数量', dataIndex: 'productNum', width: 200 }
                    }
                  }
                  item.dataIndex == 'skuSalePrice' ? ele[item.dataIndex] = element[item.dataIndex].toFixed(2) : ele[item.dataIndex] = element[item.dataIndex];
                  if (item.dataIndex == 'favorablePrice') { // 套餐sku的套餐价取值
                    if (product_goods.favorablePrice) {
                      ele[item.dataIndex] = (product_goods.favorablePrice / product_goods.productTotalNum).toFixed(2);
                    } else {
                      ele[item.dataIndex] = element[item.dataIndex] ? (element[item.dataIndex] / element.productNum).toFixed(2) : '';
                    }
                  }
                })
                ele.key = element.skuKey;
                comboTab_skuData.push(ele);
              });
              dispatch(genAction('PLATFORM_UI_GOODS_REFER_SAVE_SKU_COLUMNS', { rowKey: rowKey, data: copyArr }));
              dispatch(genAction('PLATFORM_UI_GOODS_REFER_DEAL_DATA', { comboTab_skuData, comboTab_skuColumns: copyArr }))
            }
            if (json.code !== 200) {

            }
          });
      }
      // allselectedState_combo[comboId][rowKey].data.product_productskus.forEach(element => {
      //   let ele = {};
      //   ele.skuCode = element.skuCode;
      //   ele.skuId = element.skuId;
      //   ele.key = element.skuKey;
      //   ele.skuSalePrice = element.skuSalePrice;
      //   comboTab_skuData.push(ele)
      // })
      // /*取字表columns*/
      // let comboTab_skuColumns = [
      //   { title: '', dataIndex: 'combo_kong', key: '空',fixed:'left',width:1},
      //   { title: '编码', dataIndex: 'skuCode', key: '编码',},
      //   { title: '主键', dataIndex: 'skuId', key: '主键' },
      //   { title: '零售价', dataIndex: 'skuSalePrice', key: '零售价', },]
      // dispatch(genAction('PLATFORM_UI_GOODS_REFER_DEAL_DATA', { comboTab_skuData, comboTab_skuColumns }))
    } else { //
      const skuTab_skuData = []; let skuTab_skuColumns = [];
      let isFetch = true;
      // /*antd展开行纪录的数组expandedKey*/
      /* 取字表无sku数据 */
      if (!allselectedState[rowKey]) return
      /* 取字表columns和data */
      skuColumnsArr.forEach(item => {
        if (item.rowKey == rowKey) {
          skuTab_skuColumns = item.data;
          allselectedState[rowKey].data.productskus.forEach(element => {
            const ele = {};
            skuTab_skuColumns.forEach(item => {
              ele[item.dataIndex] = element[item.dataIndex];
            })
            ele.key = element.skuKey
            skuTab_skuData.push(ele);
          });
          dispatch(genAction('PLATFORM_UI_GOODS_REFER_DEAL_DATA', { skuTab_skuData, skuTab_skuColumns }));
          isFetch = false;
        }
      });
      if (isFetch) {
        const columnsArr = []; let concatArr;
        const config = {
          url: 'mall/bill/ref/getSkuShowItem.do',
          method: 'GET',
          params: {
            productId: rowKey,
          }
        }
        proxy(config)
          .then(json => {
            if (json.code === 200) {
              json.data.forEach(element => {
                const ele = {};
                if (element.cFreeid > 10) {
                  ele.title = element.cName;
                  // ele.dataIndex = 'propertiesValue';
                  ele.dataIndex = element.key
                  ele.width = 500;
                } else {
                  ele.title = element.cName;
                  ele.dataIndex = 'free' + element.cFreeid;
                  ele.width = element.width || 100;
                }
                columnsArr.push(ele);
              })
              const headArr = [
                { title: '', dataIndex: `${tabName}_kong`, fixed: 'left', width: 1 },
                { title: '编码', dataIndex: 'skuCode', width: 150 }, ];
              const footerArr = [{ title: '零售价', dataIndex: 'skuSalePrice', className: 'columns-right', width: 100 }]
              concatArr = headArr.concat(columnsArr).concat(footerArr);
              allselectedState[rowKey].data.productskus.forEach(element => {
                const ele = {};
                concatArr.forEach((item, index) => {
                  if (item.dataIndex == 'skuSalePrice') {
                    ele[item.dataIndex] = element[item.dataIndex].toFixed(2)
                  } else {
                    // if(item.dataIndex!=`${tabName}_kong`) concatArr[index].width=120;
                    ele[item.dataIndex] = element[item.dataIndex];
                  }
                })
                ele.key = element.skuKey
                skuTab_skuData.push(ele);
              });
              dispatch(genAction('PLATFORM_UI_GOODS_REFER_SAVE_SKU_COLUMNS', { rowKey: rowKey, data: concatArr }));
              dispatch(genAction('PLATFORM_UI_GOODS_REFER_DEAL_DATA', { skuTab_skuData, skuTab_skuColumns: concatArr }))
            }
            if (json.code !== 200) {

            }
          });
      }
    }
  }
}

export function comboId_switch (type, comboId) {
  return function (dispatch, getState) {
    const comboChecked = getState().goodsRefer.toJS().comboChecked;
    if (type === 'push') {
      allselectedState_combo[comboId].checked = true;
      comboChecked.push(comboId);
    } else {
      const index = comboChecked.indexOf(comboId);
      allselectedState_combo[comboId].checked = false;
      if(index !== -1) comboChecked.splice(index, 1)
    }
    dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { comboChecked }))
  }
}

export function getGridData (options) {
  return function (dispatch, getState) {
    const { comboTab_params, tabName, referKeyword } = getState().goodsRefer.toJS();
    let filterPath;
    if (tabName !== '固定套餐' && options.path) {
      filterPath = options.path[0];
      if (filterPath === '0') filterPath = ''
    }
    if (tabName === 'sku' || tabName === '商品') {
      const promotionFilter = getState().product.toJS().promotionFilter;
      const config = fetchConfig(options, filterPath, 1, referKeyword, promotionFilter);
      proxy(config)
        .then(json => {
          if (json.code === 200) {
            const tableData = json.data.gridData;
            const skuTab_goodsData = get_skuTab_goodsData(tableData);
            if (tabName === 'sku') {
              init_allselectedState(tableData);
              dispatch(genAction('PLATFORM_UI_GOODS_REFER_SAVE_TREE_DATA', { skuTab_goodsData, tableData }));
            }
            if (tabName === '商品') {
              init_allselectedState_goods(tableData)
              dispatch(genAction('PLATFORM_UI_GOODS_REFER_SAVE_TREE_DATA', { goodsTab_goodsData: skuTab_goodsData, goodsTab_totalCount: tableData.recordCount }));
            }
          }
          if (json.code !== 200) {

          }
        });
    }
    if (tabName === '固定套餐') {
      comboTab_params.page = { pageIndex: options.pageIndex, pageSize: 100 }
      const config = {
        url: 'mall/bill/ref/getCombineSales.do',
        method: 'GET',
        params: comboTab_params,
      };
      if (!options.pageIndex) { // 全部数据或者有path过滤条件的全部数据
        if (options.path) {
          const comboTab_goodsData = [];
          const goodsArr = allselectedState_combo[options.path].data.combinationProducts || [];
          goodsArr.forEach(item => {
            const ele = {};
            ele.code = item.cCode;
            ele.name = item.cName;
            ele.productTotalNum = item.productTotalNum;
            ele.salePrice = item.salePrice.toFixed(2);
            ele.favorablePrice = item.favorablePrice ? (item.favorablePrice / item.productTotalNum).toFixed(2) : '';
            ele.key = item.goodsKey;
            ele.product_productskus = item.product_productskus;
            comboTab_goodsData.push(ele);
          })
          dispatch(genAction('PLATFORM_UI_GOODS_REFER_DEAL_DATA', { comboTab_goodsData }))
        } else {
          // 不存在comboId
        }
      } else { // 分页数据
        proxy(config)
          .then(json => {
            if (json.code === 200) {
              const comboTab_showData = init_combo(json.data.recordList)// 不必重新赋值套餐栏目
              dispatch(genAction('PLATFORM_UI_GOODS_REFER_DEAL_DATA', comboTab_showData));
            }
            if (json.code !== 200) {

            }
          })
      }
    }
  }
}
function fetchConfig (options, filterPath, queryType, keyWord, promotionFilter) {
  var gridDataUrl = {
    url: 'mall/bill/ref/getRefProducts',
    method: 'POST',
  };
  if (!options.pageIndex) { // 全部数据或者有path过滤条件的全部数据
    gridDataUrl.params = {
      externalData: { giftProductIds: promotionFilter },
      path: filterPath,
      keyWord: keyWord || '',
      queryType: queryType
    };
  } else { // 有path过滤和没path过滤的分页数据
    gridDataUrl.params = {
      externalData: { giftProductIds: promotionFilter },
      page: { pageIndex: options.pageIndex, pageSize: 8 },
      path: filterPath,
      keyWord: keyWord || '',
      queryType: queryType
    }
  }
  return gridDataUrl;
}
/* sku的select */
export function selectSku (tabName, type, goodsId, selectedKey) {
  return function (dispatch, getState) {
    if (tabName === 'sku') {
      const goodsKeyArr = getState().goodsRefer.toJS().selectedGoodsRowKeys;
      if (type === 'push') {
        allselectedState[goodsId].selected.push(selectedKey);
      } else {
        allselectedState[goodsId].selected.forEach((element, index) => {
          if (element === selectedKey) {
            allselectedState[goodsId].selected.splice(index, 1)
          }
        })
      }
      const skuKeys_arr = loopSkuSelect(tabName)
      const goodsKeys_arr = dealGoodsSelectedRowKeys(null, goodsKeyArr, tabName);
      dispatch(genAction('PLATFORM_UI_GOODS_REFER_GOODS_SKU_HANDLE', { selectedRowKeys: skuKeys_arr, selectedGoodsRowKeys: goodsKeys_arr }));
    } else if (tabName === '固定套餐') {
      const goodsRefer = getState().goodsRefer.toJS()
      const goodsKeyArr = goodsRefer.comboTab_selectedGoodsKeys;
      const comboId = goodsRefer.comboId;
      const currentValue = goodsRefer[`${selectedKey}_editValue`];
      let value; const middle = {};
      if (type === 'push') {
        allselectedState_combo[comboId][goodsId].selected.push(selectedKey);
        if (!currentValue) value = 1;
      } else {
        allselectedState_combo[comboId][goodsId].selected.forEach((element, index) => {
          if (element === selectedKey) {
            allselectedState_combo[comboId][goodsId].selected.splice(index, 1)
            value = 0;
          }
        })
      }
      allselectedState_combo[comboId][goodsId].skus[selectedKey].productNum = value;
      const skuKeys_arr = loopSkuSelect(tabName, comboId);
      dealGoodsSelectedRowKeys(null, goodsKeyArr, tabName, comboId, goodsId);
      middle.comboTab_selectedSkuKeys = skuKeys_arr;
      middle[`${selectedKey}_editValue`] = value;
      dispatch(genAction('PLATFORM_UI_GOODS_REFER_GOODS_SKU_HANDLE', middle));
    }
  }
}
/* goods的select */
export function selectGoods (goodsId, type) {
  return function (dispatch, getState) {
    const { tabName, comboId } = getState().goodsRefer.toJS();
    if (tabName === '固定套餐') {
      const combo_goodsKeyArr = getState().goodsRefer.toJS().comboTab_selectedGoodsKeys;
      const comboTab_allSku = goodsIdFetchAllSku(tabName, goodsId, comboId);
      if (type === 'push') {
        allselectedState_combo[comboId][goodsId].selected = comboTab_allSku;
      } else {
        allselectedState_combo[comboId][goodsId].selected = [];
      }
      const comboTab_sku = loopSkuSelect(tabName, comboId);
      const combo_goodsKeys_arr = dealGoodsSelectedRowKeys(null, combo_goodsKeyArr, tabName, comboId);
      dispatch(genAction('PLATFORM_UI_GOODS_REFER_GOODS_SKU_HANDLE', { comboTab_selectedSkuKeys: comboTab_sku, comboTab_selectedGoodsKeys: combo_goodsKeys_arr }));
    } else if (tabName === 'sku') { // sku页签
      const goodsKeyArr = getState().goodsRefer.toJS().selectedGoodsRowKeys;
      const goodsId_allsku = goodsIdFetchAllSku(tabName, goodsId);
      if (type === 'push') {
        allselectedState[goodsId].selected = goodsId_allsku;
      } else {
        allselectedState[goodsId].selected = [];
      }
      const skuKeys_arr = loopSkuSelect(tabName)
      const goodsKeys_arr = dealGoodsSelectedRowKeys(null, goodsKeyArr, tabName);
      dispatch(genAction('PLATFORM_UI_GOODS_REFER_GOODS_SKU_HANDLE', { selectedRowKeys: skuKeys_arr, selectedGoodsRowKeys: goodsKeys_arr }));
    }
  }
}
/* 处理求出goods的选中行 */
function dealGoodsSelectedRowKeys (titleId, goodsKeyArr, tabName, comboId, goodsKey) {
  if (tabName === 'sku') {
    for (const attr in allselectedState) {
      const skuLength = allselectedState[attr].data.productskus.length;
      const checkedLength = allselectedState[attr].selected.length;
      if (checkedLength >= skuLength && checkedLength != 0) { // goods下只有一个sku时候是大于
        allselectedState[attr].status = 'allChecked';
        if(goodsKeyArr.indexOf(Number(attr)) == -1) goodsKeyArr.push(Number(attr))
      } else if (checkedLength === 0) {
        allselectedState[attr].status = 'allUnchecked';
        goodsKeyArr.forEach((element, index) => {
          if(element == attr) goodsKeyArr.splice(index, 1)
        })
      } else {
        allselectedState[attr].status = 'partChecked';
        goodsKeyArr.forEach((element, index) => {
          if(element == attr) goodsKeyArr.splice(index, 1)
        })
      }
    }
  } else if (tabName === '固定套餐') {
    // for (let attr in allselectedState_combo[comboId]) {
    //   if (!allselectedState_combo[comboId][attr].data) continue;
    //   let skuLength = allselectedState_combo[comboId][attr].data.product_productskus.length;
    //   let checkedLength = allselectedState_combo[comboId][attr].selected.length;
    //   if (checkedLength >= skuLength && checkedLength != 0) {//goods下只有一个sku时候是大于
    //     allselectedState_combo[comboId][attr].status = 'allChecked';
    //     goodsKeyArr.indexOf(attr) == -1 ? goodsKeyArr.push(attr) : '';
    //   } else if (checkedLength === 0) {
    //     allselectedState_combo[comboId][attr].status = 'allUnchecked';
    //     goodsKeyArr.forEach((element, index) => {
    //       element == attr ? goodsKeyArr.splice(index, 1) : '';
    //     })
    //   } else {
    //     allselectedState_combo[comboId][attr].status = 'partChecked';
    //     goodsKeyArr.forEach((element, index) => {
    //       element == attr ? goodsKeyArr.splice(index, 1) : '';
    //     })
    //   }
    // }
    const skuArr = allselectedState_combo[comboId][goodsKey].selected;
    const index = allselectedState_combo[comboId].selected.indexOf(goodsKey);
    if (skuArr.length < 1) {
      if (index !== -1) allselectedState_combo[comboId].selected.splice(index, 1);
    } else {
      if(index === -1) allselectedState_combo[comboId].selected.push(goodsKey);
    }
  } else {
    for (const attr in allselectedState_goods) {
      const skuLength = allselectedState_goods[attr].data.recordList.length;
      const checkedLength = allselectedState_goods[attr].selected.length;
      if (checkedLength >= skuLength && checkedLength != 0) {
        allselectedState_goods[attr].status = 'allChecked';
        /* 当前titileId下的全选 */
        if (attr === titleId) goodsKeyArr = 'allChecked';
      } else if (checkedLength === 0) {
        allselectedState_goods[attr].status = 'allUnchecked';
        if (attr === titleId) goodsKeyArr = 'allUnchecked';
      } else {
        allselectedState_goods[attr].status = 'partChecked';
        if (attr === titleId) goodsKeyArr = 'partChecked';
      }
    }
  }
  return goodsKeyArr
}
function goodsIdFetchAllSku (tabName, goodsId, comboId) {
  /* 只服务sku和固定套餐 */
  const goodsId_skuArr = [];
  if (tabName === 'sku') {
    for (const attr in allselectedState) {
      if (attr == goodsId) {
        allselectedState[attr].data.productskus.forEach((element) => {
          goodsId_skuArr.push(element.skuKey);
        })
        return goodsId_skuArr
      }
    }
  } else if (tabName === '固定套餐') {
    for (const attr in allselectedState_combo[comboId]) {
      if (attr == goodsId) {
        const skusObj = allselectedState_combo[comboId][attr].skus;// skus对象
        for (const item in skusObj) {
          goodsId_skuArr.push(item);
        }
        return goodsId_skuArr
      }
    }
  } else {
    for (const attr in allselectedState_goods) {
      if (attr == goodsId) {
        const skuObj = allselectedState_goods[goodsId].goods;
        for (const item in skuObj) {
          goodsId_skuArr.push(parseFloat(item))
        }
        return goodsId_skuArr;
      }
    }
  }
}
function loopSkuSelect (tabName, comboId) {
  let selectedSkuKeyArr = [];
  if (tabName === 'sku') {
    for (const attr in allselectedState) {
      selectedSkuKeyArr = selectedSkuKeyArr.concat(allselectedState[attr].selected);
    }
    return selectedSkuKeyArr
  } else if (tabName === '固定套餐') { // 固定套餐
    for (const attr in allselectedState_combo[comboId]) {
      if (allselectedState_combo[comboId][attr].selected) {
        selectedSkuKeyArr = selectedSkuKeyArr.concat(allselectedState_combo[comboId][attr].selected);
      }
    }
    return selectedSkuKeyArr
  } else {
    for (const attr in allselectedState_goods) {
      selectedSkuKeyArr = selectedSkuKeyArr.concat(allselectedState_goods[attr].selected);
    }
    return selectedSkuKeyArr
  }
}

export function goodsNoSku (goodsId, val, type) {
  return function (dispatch, getState) {
    const refer_state = getState().goodsRefer.toJS();
    const comboId = refer_state.comboId
    const goodsKeyArr = refer_state.tabName === 'sku' ? refer_state.selectedGoodsRowKeys : refer_state.comboTab_selectedGoodsKeys;
    if (type === 'push') { // goodsKey加入goodsArr,skuid只需放入selected
      if (refer_state.tabName === 'sku') {
        allselectedState[goodsId].selected.push(val);
        allselectedState[goodsId].status = 'allChecked';
        goodsKeyArr.push(goodsId);
        dispatch(genAction('PLATFORM_UI_GOODS_REFER_GOODS_SKU_HANDLE', { selectedGoodsRowKeys: goodsKeyArr }));
      } else {
        allselectedState_combo[comboId][goodsId].selected.push(val);
        allselectedState_combo[comboId][goodsId].status = 'allChecked';
        goodsKeyArr.push(goodsId);
        dispatch(genAction('PLATFORM_UI_GOODS_REFER_GOODS_SKU_HANDLE', { comboTab_selectedGoodsKeys: goodsKeyArr }));
      }
    } else { // 删除goodsKey并去掉checked中的skuid
      const goodsId_skuArr = refer_state.tabName === 'sku' ? allselectedState[goodsId].selected : allselectedState_combo[comboId][goodsId].selected;
      goodsKeyArr.forEach((element, index) => {
        if(element == goodsId) goodsKeyArr.splice(index, 1)
      })
      goodsId_skuArr.forEach((value, i) => {
        if(value == val) goodsId_skuArr.splice(i, 1)
      })
      const skuKeyArr = refer_state.tabName === 'sku' ? loopSkuSelect('sku') : loopSkuSelect('固定套餐', comboId);
      if (refer_state.tabName === 'sku') {
        dispatch(genAction('PLATFORM_UI_GOODS_REFER_GOODS_SKU_HANDLE', { selectedGoodsRowKeys: goodsKeyArr, selectedRowKeys: skuKeyArr }));
      } else {
        dispatch(genAction('PLATFORM_UI_GOODS_REFER_GOODS_SKU_HANDLE', { comboTab_selectedGoodsKeys: goodsKeyArr, comboTab_selectedSkuKeys: skuKeyArr }));
      }
    }
  }
}
export function searchKeyWord (value, tabName) {
  return function (dispatch, getState) {
    const options = getState().goodsRefer.toJS().comboTab_params;
    const { treeValue, goodsTab_treeValue } = getState().goodsRefer.toJS();
    const promotionFilter = getState().product.toJS().promotionFilter;
    const config = {
      url: 'mall/bill/ref/getRefProducts',
      method: 'POST',
      params: {
        keyWord: value,
        memberLevelId: options.levelCode,
        billDate: options.date,
        externalData: { giftProductIds: promotionFilter }
      }
    };
    if (tabName !== '固定套餐') {
      config.params.queryType = 1;
      if (tabName == 'sku')
        config.params.path = treeValue[0];
      if (tabName == '商品')
        config.params.path = goodsTab_treeValue[0];
    }
    if (tabName === '固定套餐') {
      config.params.queryType = 2;
    }
    if (config.params.path && config.params.path == '0') config.params.path = ''
    // let config ={
    //   url:'mall/bill/ref/getRefProducts',
    //   method:'POST',
    //   params:{
    //     queryType:query_type,
    //     keyWord:value,
    //     memberLevelId:options.level_code,
    //     billDate:options.date,
    //   }
    // };
    proxy(config)
      .then(json => {
        if (json.code === 200) {
          if (config.params.queryType == 2) {
            if (!json.data) return
            const comboTab_totalCount = json.data.gridData.recordCount;
            const comboTab_showData = init_combo(json.data.gridData.recordList);
            dispatch(genAction('PLATFORM_UI_GOODS_REFER_DEAL_DATA', comboTab_showData))
            dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { comboTabInit: true, comboTab_totalCount }));
          }
          if (config.params.queryType == 1) {
            // let treeData = json.data.treeData;
            if (!json.data) return
            const tableData = json.data.gridData;
            init_allselectedState(tableData);
            init_allselectedState_goods(tableData);
            const skuTab_goodsData = get_skuTab_goodsData(tableData);
            const skuTab_goodsColumns = get_skuTab_goodsColumns(getState);
            /* 关键字搜索，暂无去掉缓存的树 */
            dispatch(genAction('PLATFORM_UI_GOODS_REFER_SAVE_TREE_DATA', {
              tableData, skuTab_goodsData, skuTab_goodsColumns, skuTabInit: true,
              goodsTab_totalCount: tableData.recordCount, goodsTab_goodsData: skuTab_goodsData, goodsTab_goodsColumns: skuTab_goodsColumns, goodsTabInit: true
            }));
          }
        }
        // if (json.code !== 200) return
      })
  }
}
export function referReturn () {
  return function (dispatch, getState) {
    let skuTab_dataSource = []; let goodsTab_dataSource = []; const comboTab_dataSource = {}; const selected_arr = [];
    const goodsTab_selectedKeys = getState().goodsRefer.toJS().goodsTab_selectedKeys;
    let numIsSame = true; const nameArr = []; const numArr = []
    for (const attr in allselectedState) {
      const skus = allselectedState[attr].skus;
      allselectedState[attr].selected.forEach((item) => {
        const sku_id = item.split('|')[1];
        const goodsObject = Object.assign({}, skus[sku_id], allselectedState[attr].data);
        skuTab_dataSource.push(goodsObject)
      })
    }
    if (isTable === true && skuTab_dataSource.length == 0)
      skuTab_dataSource = flatSkuExport(getState());
    for (const attr in allselectedState_goods) {
      // let goods = allselectedState_goods[attr].goods;
      // allselectedState_goods[attr].selected.forEach(item => {
      //   goodsTab_dataSource.push(goods[item]);
      // })
      goodsTab_selectedKeys.forEach(element => {
        if (element == attr) {
          selected_arr.push(allselectedState_goods[attr]);
        }
      });
    }
    if (selected_arr.length > 0) { // 若小于1是没有选中商品或数据错误
      selected_arr.forEach(item => {
        let hasFree = false;
        // for (let i in item.skus[0]) {
        //   let freeHead = i.split('free')[0];
        //   if (freeHead === '') {
        //     hasFree = true;
        //     break;
        //   }
        // }
        if(item.skus[0].specIds) hasFree = true /* 先给脉连改动，后续都需要改lz */
        if (hasFree === false && item.skus.length <= 1) {
          item.skus.forEach(val => {
            let ele = {};
            ele = Object.assign({}, item.data, val)
            goodsTab_dataSource.push(ele)
          })
        } else {
          goodsTab_dataSource.push(item.data)
        }
      })
    }
    if (isTable === true && goodsTab_dataSource.length == 0)
      goodsTab_dataSource = flatGoodsExport(getState())
    for (const attr in allselectedState_combo) {
      // let goodsArr = {}, skuArr = {};
      if (allselectedState_combo[attr].checked === true) { // 选中的套餐
        /* 校验套餐下的商品是否为全部商品 */
        const goodsSelectedLength = allselectedState_combo[attr].selected.length;
        const goodsLength = allselectedState_combo[attr].data.combinationProducts ? allselectedState_combo[attr].data.combinationProducts.length : 0;
        if (goodsLength == 0) {
          cb.utils.alert(`${allselectedState_combo[attr].data.name} 套餐没有商品`, 'error');
          return false;
        }
        if (goodsSelectedLength < goodsLength) {
          cb.utils.alert(`${allselectedState_combo[attr].data.name} 套餐中有未选择的商品`, 'error')
          return false;
        }
        comboTab_dataSource[attr] = { comboData: allselectedState_combo[attr].data, clap: [] };
        if (allselectedState_combo[attr].data) {
          for (const i in allselectedState_combo[attr]) {
            const selectedData = allselectedState_combo[attr][i].selected;
            const productData = allselectedState_combo[attr][i].data;
            if (!selectedData) continue;
            let sku_num = 0; let goods_num = 0; let shareMoney = 0;
            selectedData.forEach((item, index) => { // item=skuKey
              goods_num = allselectedState_combo[attr][i].data.productTotalNum;
              const skuData = allselectedState_combo[attr][i].skus[item];
              if (skuData.productNum) sku_num += skuData.productNum;
              if (productData.favorablePrice && selectedData.length > 1) { // 套餐价取自商品 分摊favorablePrice到sku
                if (index < selectedData.length - 1) {
                  skuData.favorablePrice = parseFloat((allselectedState_combo[attr][i].data.favorablePrice * (skuData.productNum / goods_num)).toFixed(2));
                  shareMoney += skuData.favorablePrice;
                } else {
                  skuData.favorablePrice = allselectedState_combo[attr][i].data.favorablePrice - shareMoney;
                }
              }
              const ele = Object.assign({}, allselectedState_combo[attr][i].data, allselectedState_combo[attr][i].skus[item]);
              comboTab_dataSource[attr].clap.push(ele);
            })
            if (goods_num != sku_num) {
              numIsSame = false;
              break;
            }
          }
        }
      }
      if (numIsSame === false) break;
    }
    for (const attr in allselectedState_combo) { /* 拼接alert提示语 */
      if (allselectedState_combo[attr].checked === true) {
        if (allselectedState_combo[attr].data) {
          for (const i in allselectedState_combo[attr]) {
            if (!allselectedState_combo[attr][i].selected) continue;
            nameArr.push(allselectedState_combo[attr][i].data.cName);
            numArr.push(allselectedState_combo[attr][i].data.productTotalNum);
          }
        }
      }
    }
    if (numIsSame === false) {
      const nameStr = nameArr.join(':'); const numStr = numArr.join(':')
      cb.utils.alert(`套餐成员项数量对比关系需符合：${nameStr}等于${numStr}`, 'error');
      return false
    }
    /* 三个页签都没有选中数据false */
    if (skuTab_dataSource.length == 0 && goodsTab_dataSource.length == 0 && judgeIsNull(comboTab_dataSource)) {
      cb.utils.alert('未选中商品', 'error');
      return false
    }
    // dispatch(genAction("PLATFORM_UI_PRODUCT_REFER_RETURN_PRODUCT", { sku: skuTab_dataSource, goods: goodsTab_dataSource, combo: comboTab_dataSource }))
    dispatch(dealReferReturnProducts({ sku: skuTab_dataSource, goods: goodsTab_dataSource, combo: comboTab_dataSource }))
  }
}
export function scanReferReturn (keyword, time) {
  return function (dispatch, getState) {
    const { promotionFilter, backBill_checked, products } = getState().product.toJS();
    const billingStatus = getState().uretailHeader.toJS().billingStatus;
    let isBack = 0;
    if (billingStatus === 'FormerBackBill' || billingStatus === 'NoFormerBackBill' || billingStatus === 'OnlineBackBill') isBack = 1;
    const isNegative = !!(((billingStatus === 'NoFormerBackBill' && backBill_checked) || billingStatus === 'OnlineBackBill'))
    const tableOrTree = isTable ? 'Y' : 'N';
    const config = {
      url: 'mall/bill/ref/getProducts.do',
      method: 'POST',
      params: {
        keyword: keyword,
        billDate: time,
        isReturn: isBack, // 非退货：0;退货：1
        giftProductIds: promotionFilter,
        showType: tableOrTree,
        isNegative
      }
    };
    if (!beforeScanEnterService(config, 'pc')) return
    proxy(config)
      .then(async (json) => {
        const returnObj_sku = []; const returnObj_combo = {};
        if (json.code === 200) {
          if (!json.data.type) {
            cb.utils.alert('未找到对应商品信息！', 'error');
            return
          }
          const data = json.data.data.recordList;
          const search_data = json.data.data;
          if (!data[0]) {
            cb.utils.alert('未找到对应商品信息！', 'error');
            return
          }
          if (isTable) {
            const exportData = await flatScanReturn(json.data, returnObj_sku, returnObj_combo, dispatch);
            if (exportData && exportData.skuArr.length > 0) {
              /* add by jinzh1  序列号判重 */
              const bSnRepeat = repeatSn(exportData.skuArr, products);
              if (bSnRepeat) {
                cb.utils.alert('已存在该序列号的商品！', 'error');
                return
              }
              dispatch(dealReferReturnProducts({ sku: exportData.skuArr, combo: exportData.comboArr }))
            }
            return
          }
          /* sku数据格式 */
          if (json.data.type === '1') {
            if (dealScanDataToExport(data, json.data.baccept, returnObj_sku)) { // 大于一条
              /* 1.弹出模态 */
              dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { visible: true, tabName: 'sku' }));
              /* 扫码搜索之后，取树 */
              const config = {
                url: 'mall/bill/ref/getProductRefData.do',
                method: 'POST',
                // params: {}
              }
              proxy(config)
                .then(json => {
                  if (json.code === 200) {
                    const treeData = json.data.treeData;
                    // let tableData = json.data.gridData;
                    // init_allselectedState(tableData);
                    init_allselectedState(search_data);
                    const skuTab_goodsData = get_skuTab_goodsData(search_data);
                    const skuTab_goodsColumns = get_skuTab_goodsColumns(getState)
                    dispatch(genAction('PLATFORM_UI_GOODS_REFER_SAVE_TREE_DATA', { treeData: treeData, goodsTab_treeData: treeData, tableData: search_data, skuTab_goodsData, skuTab_goodsColumns, }));
                    return // 弹出模态 结束
                  }
                  if (json.code !== 200) {

                  }
                });
              /** 扫码搜索之后，不去取树
              init_allselectedState(search_data);
              let skuTab_goodsData = get_skuTab_goodsData(search_data);
              let skuTab_goodsColumns = get_skuTab_goodsColumns()
              dispatch(genAction('PLATFORM_UI_GOODS_REFER_SAVE_TREE_DATA', { tableData: search_data, skuTab_goodsData, skuTab_goodsColumns, })); */
            }
          }
          /* 套餐数据格式 */
          if (json.data.type === '3') {
            /* 扫码搜索之后，取树 */
            const config = {
              url: 'mall/bill/ref/getProductRefData.do',
              method: 'POST',
              // params: {}
            }
            proxy(config)
              .then(json => {
                if (json.code === 200) {
                  const treeData = json.data.treeData;
                  dispatch(genAction('PLATFORM_UI_GOODS_REFER_SAVE_TREE_DATA', { treeData: treeData, goodsTab_treeData: treeData }));
                }
                if (json.code !== 200) {

                }
              });
            const length = data.length;
            /* if(length==1){
              data.forEach(element=>{
                returnObj_combo[element.id]={clap:[],comboData:element};
                element.combinationProducts.forEach((item,index)=>{
                  item.goodsKey = element.id + '|' + item.product;
                  element.combinationProducts[index].product_productskus.forEach(val=>{
                    val.skuKey = item.product + '|' + val.skuId;
                    let ele={};
                    ele = Object.assign({},item,val);
                    returnObj_combo[element.id].clap.push(ele);
                  })
                })
              })
              alert('数据导出成功，等待后续处理！')
            }直接导出套餐 */
            if (length > 0) {
              /* 1.弹出模态2.切换页签到套餐 */
              dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { visible: true, tabName: '固定套餐' }));
              const comboTab_totalCount = json.data.data.recordCount;
              const comboTab_showData = init_combo(json.data.data.recordList)
              dispatch(genAction('PLATFORM_UI_GOODS_REFER_DEAL_DATA', comboTab_showData))
              dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { comboTabInit: true, comboTab_totalCount, }));
              return // 弹出模态 结束
            }
          }
          // dispatch(genAction("PLATFORM_UI_PRODUCT_REFER_RETURN_PRODUCT", { sku: returnObj_sku, combo: returnObj_combo}))
          if (returnObj_sku.length > 0 || returnObj_combo.length > 0) {
            /* add by jinzh1  序列号判重 */
            const bSnRepeat = repeatSn(returnObj_sku, products);
            if (bSnRepeat) {
              cb.utils.alert('已存在该序列号的商品！', 'error');
              return
            }
            dispatch(dealReferReturnProducts({ sku: returnObj_sku, combo: returnObj_combo }))
          }
        }
        if (json.code !== 200) {
          cb.utils.alert(json.message, 'error')
        }
      })
  }
}

const dealScanDataToExport = (data, baccept, returnObj_sku) => {
  if (baccept) {
    data.forEach(row => {
      row.productskus && row.productskus.forEach((sku, index) => {
        let ele = {};
        sku.skuKey = row.id + '|' + sku.skuId + '|' + index;
        ele = Object.assign({}, row, sku)
        returnObj_sku.push(ele)
      })
    })
    return false
  } else {
    if (data.length == 1 && data[0].productskus && data[0].productskus.length == 1) {
      let ele = {};
      data[0].productskus[0].skuKey = data[0].id + '|' + data[0].productskus[0].skuId;
      ele = Object.assign({}, data[0], data[0].productskus[0])
      returnObj_sku.push(ele)
      return false
    }
  }
  return true
}

/* add by jinzh1 序列号判重函数 */
const repeatSn = (data, products) => {
  const row = data[0];
  if (row.sn) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].bFixedCombo && products[i].children) {
        for (const child of products[i].children) {
          if (row.sn == child.cSerialNo) return true
        }
      } else {
        if (row.sn == products[i].cSerialNo) {
          return true;
        }
      }
    }
  }
  return false;
}
/* 处理列表型数据的扫码导出 */
const flatScanReturn = async (data, skuArr, comboArr, dispatch) => {
  const dataSource = data.data;
  if (data.type === '1') {
    if (dataSource.recordList.length == 1) { // 只有一条sku
      const obj = dataSource.recordList[0];
      obj.skuKey = `${obj.id}|${obj.skuId}`;
      skuArr.push(obj)
    } else {
      if (data.baccept) { // 精确匹配全部带出
        dataSource.recordList.forEach((ele, index) => {
          ele.skuKey = `${ele.id}|${ele.skuId}|${index}`
          skuArr.push(ele)
        })
      } else {
        dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { visible: true }));
        const skuTree = await getSkuTree();
        dispatch(initSku(skuTree, dataSource));
        return
      }
    }
  }
  if (data.type === '3') {
    if (length > 0) {
      /* 1.弹出模态2.切换页签到套餐 */
      dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { visible: true, tabName: '固定套餐' }));
      const comboTab_totalCount = dataSource.recordCount;
      const comboTab_showData = init_combo(dataSource.recordList)
      dispatch(genAction('PLATFORM_UI_GOODS_REFER_DEAL_DATA', comboTab_showData))
      dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { comboTabInit: true, comboTab_totalCount, }));
      return // 弹出模态 结束
    }
  }
  return { skuArr, comboArr }
}

/* 只取左树 */
const getSkuTree = async function () {
  let treeData = []
  const config = {
    url: 'mall/bill/ref/getProductRefData.do',
    method: 'POST',
    // params: {}
  }
  const json = await proxy(config);
  if (json.code == 200) treeData = json.data.treeData;
  return treeData
}

function judgeIsNull (obj) {
  for (const attr in obj) {
    return false
  }
  return true
}
export function setColumnRender (data) {
  return function (dispatch) {
    for (var attr in data)
      columnsRender[attr] = data[attr];
  }
}
export function setEditCellNum (value, comboId, goodsKey, key) {
  return function (dispatch, getState) {
    // let { comboChecked } = getState().goodsRefer.toJS();
    const middle = {};
    const index = allselectedState_combo[comboId][goodsKey].selected.indexOf(key);
    if (value > 0) {
      /* 商品勾选,套餐勾选 */
      if(index === -1) allselectedState_combo[comboId][goodsKey].selected.push(key)
      // allselectedState_combo[comboId].checked = true;
      // comboChecked.push(comboId);
    }
    if (value == 0) {
      if(index !== -1) allselectedState_combo[comboId][goodsKey].selected.splice(index, 1)
    }
    allselectedState_combo[comboId][goodsKey].skus[key].productNum = value;
    middle[`${key}_editValue`] = value;
    const skuKeys_arr = loopSkuSelect('固定套餐', comboId);
    dealGoodsSelectedRowKeys(null, null, '固定套餐', comboId, goodsKey);
    dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', middle));
    dispatch(genAction('PLATFORM_UI_GOODS_REFER_GOODS_SKU_HANDLE', { comboTab_selectedSkuKeys: skuKeys_arr }));
  }
}
export function setCombo_rowClassName (tabName, comboId, key) {
  return function (dispatch, getState) {
    if (tabName === '固定套餐') {
      const data = getState().goodsRefer.toJS().comboTab_copyData;
      for (const attr in data[comboId]) {
        if (!data[comboId][attr].skus) continue;
        if (attr == key) {
          const skus_obj = data[comboId][attr].skus;
          for (const i in skus_obj) {
            if (skus_obj[i].productNum) {
              return 'combo_hideCheckBox'
            } else {
              return 'combo_showCheckBox'
            }
          }
        }
      }
    }
    if (tabName === 'sku') {
      for (const attr in allselectedState) {
        if (attr == key) {
          const sku_arr = allselectedState[attr].data.productskus;
          if (sku_arr.length == 0) return// 后台数据格式不可能为空
          if (sku_arr.length == 1) {
            // for (let i in sku_arr[0]) {
            //   let hasFree = i.split('free')[0];
            //   if (hasFree == '') {//存在规格项
            //     return 'sku_hasSpec'
            //   }
            // }
            // return 'sku_noSpec'
            let returnName = '' /* 先给脉连改动，后续都需要改lz */
            sku_arr[0].specIds ? returnName = 'sku_hasSpec' : returnName = 'sku_noSpec';
            return returnName
          }
          return 'sku_hasSpec'
        }
      }
    }
  }
}

/* 取商品页签的主表栏目 */
export function getMasterColumns (resolve, reject) {
  return function (dispatch) {
    const config = {
      url: 'pub/ref/getRefMeta',
      method: 'GET',
      params: {
        refCode: 'aa_nomalproduct4Sale',
      }
    }
    proxy(config).then(json => {
      if (json.code !== 200) {
        cb.utils.alert(json.message, 'error');
        return
      }
      const view = json.data.gridMeta.viewApplication.view;
      const currentContainer = view.containers.find(ele => {
        return ele.cName === 'Table'
      })
      if (currentContainer) {
        dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { masterColumns: currentContainer.controls }))
        resolve && resolve(true)
      } else {
        reject('fail')
      }
    })
  }
}

export function clearPage (value) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_GOODS_REFER_CLEAR_PAGE', value));
  }
}

export function clearRedux (obj) {
  return function (dispatch) {
    allselectedState = {};
    allselectedState_goods = {};
    allselectedState_combo = {};
    dispatch(genAction('PLATFORM_UI_GOODS_REFER_CLEAR_REDUX'));
    dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { isTable: isTable }))
    dispatch(skuClear());
    dispatch(goodsClear());
  }
}

export const beforeScanEnterService = (config, mode) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeScanEnterService', {config, mode})
}
