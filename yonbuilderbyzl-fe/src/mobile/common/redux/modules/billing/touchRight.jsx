import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import * as FormatDate from '@mdf/cube/lib/helpers/formatDate';
import { dealReferReturnProducts } from './product';
import { getBillingTouchOptions, getBillingViewModel } from './config';
import { getOptions } from './mix';
import { beforeScanEnterService } from './goodsRefer';
import _ from 'lodash'
// '0': [{skuCode: '00001', cName: '常用商品', skuSalePrice: '998'}]
let touchMap = {};
let allDataSource = [];
let copy_allDataSource = [];/* 总数据备份 */
let copy_dataSource = [];/* 当前展示数据备份 */
let dataSource = [];
let cacheReferData = null;
let viewInstance = null;

let showLevel1; let showLevel2; let showEnd; let onlyOneCategory; let commonProduct = [];

const initState = {
  // dataSource: [],
  firstKind: [], // 一级树
  secondKind: {}, // 二级树的map
  secondTree: [], // 二级树
  searchValue: '',
  firstPath: '',
  secondPath: '',
  searchResult: false, // 是否正在执行搜索
  electronicPage: 1, /* 电子秤的分页 */
  dxc_selected_product: '', /* 稻香村要的选中样式 */
}
const $$initState = Immutable.fromJS(initState);

export default ($$state = $$initState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS':
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_TOUCH_RIGHT_CONTENT_RETURN_ORIGIN_DATA':
    case 'PLATFORM_UI_BILLING_PRODUCT_CLEAR_PROMOTION':
    case 'PLATFORM_UI_BILLING_CLEAR': {
      /* 清除促销 */
      const state = $$state.toJS();
      if (copy_allDataSource.length > 0) {
        allDataSource = copy_allDataSource;
        dataSource = copy_dataSource;
        state.firstPath = state.copy_firstPath;
        state.secondPath = state.copy_secondPath;
        state.searchResult = state.copy_searchResult;
        state.searchValue = '';
        state.touchHasGetGiftService = false;
        state.electronicPage = 1;
        return Immutable.fromJS(state)
      } else {
        state.searchValue = ''
        state.electronicPage = 1;
        return Immutable.fromJS(state)
      }
    }
    case 'PLATFORM_UI_TOUCH_RIGHT_LOGIN_CACHE_REFER_DATA':
      cacheReferData = action.payload;
      return $$state;
    case 'PLATFORM_UI_TOUCH_RIGHT_CONTENT_CLEAR':
      return Immutable.fromJS(initState)
    default:
      return $$state
  }
}

export function setOptions (obj) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS', obj))
  }
}

export function getServiceData () {
  return async function (dispatch, getState) {
    // let config = {
    //     /*url: 'mall/bill/ref/getProductRefData.do',*/
    //     url: 'mall/bill/mobile/queryproductsku.do',
    //     method: 'POST',
    //     /*params: {
    //         externalData: { giftProductIds: null ,showType: 'Y'},
    //         page: {pageSize: 100}
    //     }*/
    // }

    const config = {
      url: 'mall/bill/mobile/queryproductsku.do',
      method: 'POST',
      params: {
        externalData: { isPage: false, showType: 'N' }
      }
    }
    const json = cacheReferData || await proxy(config);
    if (json.code === 200) {
      referDataDeal(json, dispatch)
      // let treeData = json.data.treeData;
      // let gridData = json.data.gridData.recordList;
      // dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS', { allDataSource: gridData }))
      // treeData && gridData && initTouchDataSource(treeData, gridData, dispatch)
    } else {
      cb.utils.alert(`错误代码:${json.code};错误信息:${json.message}`)
    }
  }
}

export const referDataDeal = (json, dispatch) => {
  const treeData = json.data.treeData;
  const gridData = json.data.gridData.recordList;
  // dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS', { allDataSource: gridData }))
  allDataSource = gridData;
  treeData && gridData && initTouchDataSource(treeData, gridData, dispatch)
}

const initTouchDataSource = (treeData, gridData, dispatch) => {
  const firstKind = []; const secondKind = {};
  /* add by jinzh1 触屏开单配置 */
  const options = getBillingTouchOptions();
  const { commonProductData, basicSettingData } = options;
  const goodsCategory = basicSettingData.goodsCategory;
  const showCategory = goodsCategory ? goodsCategory.split(',') : ['1', '2'];
  if (showCategory.length == 0) {
    cb.utils.alert('商品分类显示数据错误！', 'error');
    return
  }
  showLevel1 = false; showLevel2 = false; showEnd = false; touchMap = {};
  showCategory.map(category => {
    if (category == 1) showLevel1 = true;
    if (category == 2) showLevel2 = true;
    if (category == 3) showEnd = true;
  });
  onlyOneCategory = showCategory.length == 1;

  recursionTree(treeData, firstKind, secondKind); // 递归树
  const firstPath = recursionTableData(gridData, dispatch, firstKind, commonProductData); // 递归表数据
  const secondTree = (secondKind && secondKind[firstPath]) ? secondKind[firstPath] : [];
  dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS', { firstKind, secondKind, firstPath, secondTree }))
}
const recursionTree = (treeData, firstKind, secondKind, parent) => {
  if (onlyOneCategory) secondKind = {};
  treeData.forEach(tree => {
    if(!tree.showInTouchpad) return;
    if (onlyOneCategory) { /* 只有一个分类 */
      if (showLevel1 && (tree.level == 1))
        firstKind.push(tree)
      if (showLevel2) {
        if (tree.level == 2) {
          firstKind.push(tree)
        } else {
          if (tree.level == 1 && !tree.children)
            firstKind.push(tree)
        }
      }
      if (showEnd && !tree.children)
        firstKind.push(tree)
      if ((showLevel2 || showEnd) && tree.children)
        recursionTree(tree.children, firstKind);
    } else {
      /* 1级分类+2级分类 */
      if (showLevel1 && showLevel2) {
        if (tree.level == 1) {
          firstKind.push(tree)
          if (tree.children)
            recursionTree(tree.children, firstKind, secondKind, tree.id);
        }
        if (tree.level == 2) {
          if (!secondKind[parent] && parent != undefined) {
            secondKind[parent] = [tree]
          } else {
            parent != undefined && secondKind[parent].push(tree)
          }
        }
      }
      /* 1级分类+除1级外的末级分类 */
      if (showLevel1 && showEnd) {
        if (tree.level == 1) {
          firstKind.push(tree)
          if (tree.children) recursionTree(tree.children, firstKind, secondKind, tree.id);
        } else {
          if (tree.children)
            recursionTree(tree.children, firstKind, secondKind, parent);
          else
          if (!secondKind[parent] && parent != undefined) {
            secondKind[parent] = [tree]
          } else {
            parent != undefined && secondKind[parent].push(tree)
          }
        }
      }
      /* 1级为末级和2级分类 + 除1,2级外的末级分类 */
      if (showLevel2 && showEnd) {
        if (tree.level == 1) {
          if (tree.children)
            recursionTree(tree.children, firstKind, secondKind, tree.id);
          else
            firstKind.push(tree)
        } else {
          if (tree.children) recursionTree(tree.children, firstKind, secondKind, tree.id);
          if (tree.level == 2)
            firstKind.push(tree)
          else
          if (!secondKind[parent] && parent != undefined) {
            secondKind[parent] = [tree]
          } else {
            parent != undefined && secondKind[parent].push(tree)
          }
        }
      }
    }
  })
}
const recursionTableData = (gridData, dispatch, firstKind, commonProductData) => {
  commonProduct = [];
  gridData.forEach(product => {
    for (var i = 0; i < commonProductData.length; i++) {
      if (product.id == commonProductData[i].product) {
        product.orderBy = commonProductData[i].orderBy;
        commonProduct.push(product);
        break;
      }
    }
    const path = product.ppath ? product.ppath.split('|') : '';
    if (path.length === 3)
      touchMap[path[1]] ? touchMap[path[1]].push(product) : touchMap[path[1]] = [product]
    if (path.length === 4) {
      touchMap[path[1]] ? touchMap[path[1]].push(product) : touchMap[path[1]] = [product];
      touchMap[path[2]] ? touchMap[path[2]].push(product) : touchMap[path[2]] = [product];
    }
    if (path.length === 5) {
      touchMap[path[1]] ? touchMap[path[1]].push(product) : touchMap[path[1]] = [product];
      touchMap[path[2]] ? touchMap[path[2]].push(product) : touchMap[path[2]] = [product];
      touchMap[path[3]] ? touchMap[path[3]].push(product) : touchMap[path[3]] = [product];
    }
    if (product.secondaryProductClass && product.secondaryProductClass.length > 0) {
      product.secondaryProductClass.forEach(ele => {
        touchMap[ele.productClass] ? touchMap[ele.productClass].push(product) : touchMap[ele.productClass] = [product];
      })
    }
  })
  let defaultTree = firstKind[0] && firstKind[0].id;
  let defaultShow = touchMap[defaultTree] || [];
  if (commonProduct && commonProduct.length > 0) {
    defaultTree = 'showCY';
    commonProduct = _.sortBy(commonProduct, 'orderBy');
    defaultShow = commonProduct
  } else {
    defaultTree = 'showAll';
    defaultShow = gridData;
  }
  dataSource = defaultShow;
  // dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS', { dataSource: defaultShow }))
  return defaultTree;
}

export function seletDataSource (path, initSecond) {
  return async function (dispatch, getState) {
    const promotionFilter = getState().product.get('promotionFilter') ? getState().product.get('promotionFilter').toJS() : null;

    const options = { secondPath: path, searchResult: false, searchValue: '', electronicPage: 1 };
    if (promotionFilter && promotionFilter.length > 0) {
      const searchValue = getState().touchRight.get('searchValue');
      dataSource = await selectTreePromotion(promotionFilter, path, searchValue);
    } else {
      if (path == 'showAll') { /* 全部 */
        dataSource = allDataSource;
        options.secondTree = [];
        options.firstPath = 'showAll';
      } else if (path == 'showCY') { /* 常用 */
        dataSource = commonProduct;
        options.secondTree = [];
        options.firstPath = 'showCY';
      } else {
        dataSource = touchMap[parseInt(path)];
      }
      if(!dataSource) dataSource = [];
    }
    // options.dataSource = dataSource;
    if (initSecond) {
      const secondKind = getState().touchRight.get('secondKind').toJS();
      const secondTree = secondKind[path] ? secondKind[path] : [];
      options.secondTree = secondTree;
      options.firstPath = path;
    }
    dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS', options))
  }
}

/* 取带有促销信息的数据 */ /* 触屏商品参照数据格式统一走列表展现形式（isTable:'Y'） */
const selectTreePromotion = async (promotionFilter, filterPath, keyWord) => {
  let data = [];
  const config = {
    url: 'mall/bill/ref/getRefProducts',
    method: 'POST',
    params: {
      externalData: { giftProductIds: promotionFilter, showType: 'Y' },
      path: filterPath || '',
      keyWord: keyWord || '',
      queryType: 1
    }
  }
  const json = await proxy(config);
  if (json.code !== 200) {
    cb.uitls.alert(json.message, 'error');
    return data
  }
  data = json.data.gridData.recordList;
  return data
}

export function scanSearch (value) {
  return function (dispatch, getState) {
    const firstPath = getState().touchRight.get('firstPath');
    const secondPath = getState().touchRight.get('secondPath');
    const exactMatch = getOptions().touchGoodsSearch && getOptions().touchGoodsSearch.value == 2

    if (!value) { // 搜索框value为空，恢复搜索之前树，数据的状态
      // let pathArr = null, touchMap_key = '';
      if (exactMatch) return // todo searchResult未恢复
      if (firstPath && firstPath == 'showAll') {
        dataSource = allDataSource;
      } else if (firstPath && firstPath == 'showCY') {
        dataSource = commonProduct;
      } else if (secondPath) {
        dataSource = touchMap[secondPath];
      } else {
        dataSource = touchMap[firstPath];
      }
      dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS', { searchResult: false }));
      return
    }
    let accurateMatch = [];
    if (exactMatch) {
      // accurateMatch = allDataSource.filter(product => {
      //   if (product.barCode == value)
      //     return product
      //   if (product.cCode == value)
      //     return product
      //   if (product.mnemonicCode && product.mnemonicCode.toLowerCase() == value.toLowerCase())
      //     return product
      //   if (product.cName == value)
      //     return product
      // })
      return
    } else {
      accurateMatch = allDataSource.filter(product => {
        if (product.barCode == value)
          return product
        if (product.cCode && product.cCode.includes(value))
          return product
        if (product.mnemonicCode && product.mnemonicCode.toLowerCase().includes(value.toLowerCase()))
          return product
        if (product.cName && product.cName.includes(value))
          return product
      })
    }
    dataSource = accurateMatch || [];
    dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS', { searchResult: false }));
    // dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS', { dataSource: accurateMatch || [] }))
  }
}

export function okBtnSearch (value) {
  return function (dispatch) {
    const exactMatch = getOptions().touchGoodsSearch && getOptions().touchGoodsSearch.value == 2;
    if (exactMatch) {
      return allDataSource.filter(product => {
        if (product.barCode == value)
          return product
        if (product.cCode == value)
          return product
        if (product.mnemonicCode && product.mnemonicCode.toLowerCase() == value.toLowerCase())
          return product
        if (product.cName == value)
          return product
      })
    }
    // dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS', { searchResult: false }));
    // return dataSource
  }
}

/**
 * @param isSlef 自主大屏的处理
*/
export function scanEnter (keyword, time, isSelf, isSelfScan) {
  return function (dispatch, getState) {
    const promotionFilter = getState().product.get('promotionFilter') ? getState().product.get('promotionFilter').toJS() : null;
    const billingStatus = getState().uretailHeader.toJS().billingStatus;
    let isBack = 0;
    const isTable = true;
    if (billingStatus === 'FormerBackBill' || billingStatus === 'NoFormerBackBill') isBack = 1;
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
      }
    };
    // !isSelf && dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS', {searchValue: '0'})) 储值卡刷卡有问题
    if(!beforeScanEnterService(config, 'touch')) return
    proxy(config)
      .then(async (json) => {
        const returnObj_sku = []; const returnObj_combo = {};
        if (json.code === 200) {
          if (!json.data.type) {
            isSelf && window.sendSef('noProductAlarm', '')
            if (isSelf && !isSelfScan) {
              dispatch(genAction('PLATFORM_UI_BILLING_SELF_SET_COMMON', { batchMsg: '未找到商品信息！', okClick: false }))
              return
            }
            cb.utils.alert('未找到商品信息！', 'error');
            return
          }
          const data = json.data.data.recordList;
          // let search_data = json.data.data;
          if (!data[0]) {
            isSelf && window.sendSef('noProductAlarm', '')
            if (isSelf && !isSelfScan) {
              dispatch(genAction('PLATFORM_UI_BILLING_SELF_SET_COMMON', { batchMsg: '未找到商品信息！', okClick: false }))
              return
            }
            cb.utils.alert('未找到商品信息！', 'error');
            return
          }
          if (data.length > 1 && isSelf) {
            isSelf && window.sendSef('noProductAlarm', '')
            if (isSelfScan) {
              cb.utils.alert('未找到商品信息！', 'error');
              return
            }
            dispatch(genAction('PLATFORM_UI_BILLING_SELF_SET_COMMON', { batchMsg: '未找到商品信息！', okClick: false }))
            return
          }
          // fangqg: 返回多个商品暂时走客户端过滤逻辑
          if (data.length > 1) {
            dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS', { searchResult: true }));
            dispatch(scanSearch(data[0].cCode));
            return;
          }
          if (isTable) {
            const exportData = await flatScanReturn(json.data, returnObj_sku, returnObj_combo, dispatch);
            if (exportData && exportData.skuArr.length > 0) {
              if (isSelf) {
                /* add by jinzh1 添加扫码来源标识 */
                exportData.skuArr.forEach(row => {
                  row.bScanSource = true;
                });
                dispatch(genAction('PLATFORM_UI_BILLING_SELF_SET_COMMON', { visible: false, batchNo: '', okClick: false }))
              }
              if (cb.rest.interMode === 'touch') {
                const bSnRepeat = repeatSn(exportData.skuArr, getState);
                if (bSnRepeat) {
                  cb.utils.alert('已存在该序列号的商品！', 'error');
                  return
                }
                touchGetCachePrice(exportData)
              }
              dispatch(dealReferReturnProducts({ sku: exportData.skuArr, combo: exportData.comboArr }))
              // if(isSelf){
              //     dispatch(genAction('PLATFORM_UI_BILLING_SELF_SET_COMMON', {visible: false, batchNo: '', okClick: false}))
              //     return
              // }
            }
            return
          }
        }
        if (json.code !== 200) {
          if (isSelf) {
            isSelf && window.sendSef('noProductAlarm', '')
            if (isSelfScan) { // 扫码
              cb.utils.alert(json.message, 'error')
              return
            }
            // 手录
            dispatch(genAction('PLATFORM_UI_BILLING_SELF_SET_COMMON', { batchMsg: json.message, okClick: false }))
            return
          }
          cb.utils.alert(json.message, 'error')
        }
      })
  }
}

export function scanEnterClient (value) {
  return function (dispatch) {
    /**
     * 商品编码 => 商品条码 => 商品名称
     */
    const exactProducts = [];
    for (const product of allDataSource) {
      if (product.cCode == value || product.barCode == value || product.cName == value)
        exactProducts.push(product)
    }
    if (exactProducts.length == 1) {
      viewInstance && viewInstance.goodsSelect(exactProducts[0])
    } else if (exactProducts.length > 1) {
      dataSource = exactProducts
    } else {
      dispatch(scanEnter(value, FormatDate.Format(new Date(), 'yyyy-MM-dd hh:mm:ss')))
    }
  }
}

export function getInstance (_inst, destory) {
  if (destory)
    viewInstance = null
  else
    viewInstance = _inst
}

/* 序列号判重lz */
const repeatSn = (data, getState) => {
  if (!data || data.length < 1) return false
  const row = data[0];
  if (row.sn) {
    let products = getState().product.get('products')
    if (!Immutable.Iterable.isIterable(products)) products = Immutable.fromJS(products)
    for (const oldRow of products.values()) {
      if (row.sn == oldRow.get('cSerialNo')) {
        return true;
      }
    }
  }
  return false;
}

/* 触屏扫码完 取缓存的价格表 */
const touchGetCachePrice = (exportData) => {
  /* scanProduct: 扫描出的行； product: 对应的缓存行 */
  if (!beforeTouchGetCachePrice(exportData)) return
  let scanProduct = exportData.skuArr && exportData.skuArr[0]
  if(!scanProduct) return
  let product = allDataSource.find(ele => {
    return ele.product === scanProduct.id
  })
  product = JSON.parse(JSON.stringify(product))
  if (scanProduct.skuId) {
    if (scanProduct.skuId == product.skuId) {
      scanProduct = Object.assign({}, scanProduct, product)
    } else if (product.productskus) {
      const { skuId } = scanProduct;
      scanProduct = Object.assign({}, scanProduct, product)
      const skuData = product.productskus.find(ele => {
        return ele.skuId === skuId
      })
      Object.assign(scanProduct, skuData)
      scanProduct.skuKey = `${scanProduct.id}|${scanProduct.skuId}`;
      delete scanProduct.productskus
    }
  }else{ // 扫描出来为商品
    if (product.productskus) {
      if (product.productskus.length == 1) {
        let hasFree = false
        for (const attr in product.productskus[0]) {
          if (attr.includes('free')) {
            hasFree = true
            break
          }
        }
        if (!hasFree) {
          product.skuKey = `${product.id}|${product.productskus[0].skuId}`;
          Object.assign(product, product.productskus[0])
        }
      }
    }
    scanProduct = Object.assign({}, scanProduct, product)
  }
  exportData.skuArr = [scanProduct]
}
const flatScanReturn = async (data, skuArr, comboArr, dispatch) => {
  const tableData = data.data.recordList || [];
  // dataSource = tableData; 服务和缓存因价格表 价格不一致
  if (data.type === '1') {
    if (tableData.length == 1) { // 只有一条sku
      const obj = tableData[0];
      obj.skuKey = `${obj.id}|${obj.skuId}`;
      skuArr.push(obj)
    } else {
      // 扫码多条sku暂未初始化到touchMap对象中
      // dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS', { dataSource: dataSource.recordList }))
    }
  }
  if (data.type === '3') {
    //   if(length>0){
    //     /*1.弹出模态2.切换页签到套餐*/
    //     dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS',{visible:true,tabName:'固定套餐'}));
    //     let comboTab_totalCount = dataSource.recordCount;
    //     let comboTab_showData=init_combo(dataSource.recordList)
    //     dispatch(genAction('PLATFORM_UI_GOODS_REFER_DEAL_DATA', comboTab_showData))
    //     dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { comboTabInit: true, comboTab_totalCount,}));
    //     return //弹出模态 结束
    //   }
    cb.utils.alert('未找到对应商品信息', 'error')
  }
  return { skuArr, comboArr }
}

/* 取促销赠品的商品数据 */
export function getPromotionData (promotionFilter) {
  return async function (dispatch, getState) {
    const origin_dataSource = dataSource;
    const origin_allDataSource = allDataSource;
    const origin_firstPath = getState().touchRight.get('firstPath');
    const origin_secondPath = getState().touchRight.get('secondPath');
    const origin_searchResult = getState().touchRight.get('searchResult');

    const config = {
      url: 'mall/bill/ref/getProductRefData.do',
      method: 'POST',
      params: {
        externalData: { giftProductIds: promotionFilter, showType: 'Y' },
        // queryType: 1,
        page: { pageIndex: 1, pageSize: 500 }
      },
    }
    const json = await proxy(config);
    if (json.code !== 200) {
      cb.utils.alert(json.message, 'error');
      return
    }
    const tableData = json.data.gridData.recordList;
    allDataSource = [];
    copy_allDataSource = origin_allDataSource;
    copy_dataSource = origin_dataSource;
    dataSource = tableData;
    dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS', {
      firstPath: '',
      secondPath: '',
      searchValue: '',
      secondTree: [],
      copy_firstPath: origin_firstPath,
      copy_secondPath: origin_secondPath,
      copy_searchResult: origin_searchResult,
      touchHasGetGiftService: true,
    }))
  }
}

export function clear () {
  return function (dispatch) {
    touchMap = {};
    dispatch(genAction('PLATFORM_UI_TOUCH_RIGHT_CONTENT_CLEAR'))
  }
}

export function getDataSource () {
  return dataSource;
}

/* 常用商品 */
export function getCommonProduct () {
  return commonProduct;
}

const beforeTouchGetCachePrice = (exportData) => {
  const billingViewModel = getBillingViewModel()
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeTouchGetCachePrice', {exportData})
}
