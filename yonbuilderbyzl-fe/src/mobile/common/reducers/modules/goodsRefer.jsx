import Immutable from 'immutable';
import { proxy, genAction } from '@mdf/cube/lib/helpers/util'
import { goBack } from 'react-router-redux'
import { dealReferReturnProducts, combineSpecToProduct } from 'src/common/redux/modules/billing/product'

const skuKeyMap = {};
const initialState = {
  visible: false, // popover
  radioKey: {}, // 规格单选框key值map
  refreshing: false, // 上拉刷新
  referKeyword: '',
  treePath: '',
  accordionKey: '', // 手风琴的key
  pageIndex: 1,
  currentProduct: null, // 当前选规格的商品行
  stepValue: 1, // 数量
  cartInfo: { /* 购物车信息 */
    cartVisible: false,
    numObj_withSpec: {}, /* 只为了显示规格上的徽标 */
    numObj: {},
    cartData: []
  },
  isGetNextData: true,
  isSearchResult: false, /* 当前数据是否为搜索而出 */
  stashSku: {}, /* 选择sku规格后，缓存取到sku信息（价格显示） */
}

export default ($$state = Immutable.fromJS(initialState), action) => {
  switch (action.type) {
    case 'PLATFORM_UI_GOODS_REFER_SET_OPTIONS':
      return $$state.merge(action.payload);
    case 'URETAIL_MOBILE_GOODSREFER_SET_OPTIONS':
      return $$state.merge(action.payload)
    case 'URETAIL_MOBILE_GOODSREFER_CHANGE_OBJ_INFO':
      // let {key, value} = action.payload;
      return $$state.mergeDeepIn(action.payload.key, action.payload.value)
    case 'URETAIL_MOBILE_GOODSREFER_CART_PUSH_DATA':
      // let { key, value } = action.payload;
      return $$state.updateIn(action.payload.key, (arr) => {
        arr.push(action.payload.value)
      })
    case 'URETAIL_MOBILE_GOODSREFER_CLEAR':
      return Immutable.fromJS(initialState)
    case 'PLATFORM_UI_BILLING_CLEAR':
      return Immutable.fromJS(initialState)
    default:
      return $$state
  }
}

export function setSearchBoxFocus (focus) {
  return genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { focus });
}

export const setOptions = (obj) => {
  return function (dispatch) {
    dispatch(genAction('URETAIL_MOBILE_GOODSREFER_SET_OPTIONS', obj))
  }
}

export function changeObjInfo (obj) {
  return function (dispatch) {
    dispatch(genAction('URETAIL_MOBILE_GOODSREFER_CHANGE_OBJ_INFO', obj))
  }
}

export function cartPushData (obj) {
  return function (dispatch) {
    dispatch(genAction('URETAIL_MOBILE_GOODSREFER_CART_PUSH_DATA', obj))
  }
}

// 商品页签的服务
export function getFlatGoodsData (needTree, selectedKeys, options, keyword, isSearch) {
  return async function (dispatch, getState) {
    const origin_tableData = getState().goodsRefer.toJS().tableData;
    const keyWord = keyword != undefined ? keyword : getState().goodsRefer.toJS().referKeyword;
    let path = selectedKeys || '';
    if (path === '0') path = '';
    // if(options){// 有分页
    //     dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_GOODS_SET_OPTIONS', {pageIndex: options.pageIndex, treePath: path, keyWord}))
    // }else{
    //     dispatch(genAction('PLATFORM_UI_GOODS_REFER_FLAT_GOODS_SET_OPTIONS', {pageIndex: 1, treePath: path, keyWord}))
    // }
    const json = await getProxy(needTree, path, keyWord, options);
    if (json.code == 200) {
      const { gridData, treeData } = json.data;
      const tableData = gridData.recordList || [];
      editServiceData(tableData);
      if (treeData) { // 初始化数据
        const defaultPath = treeData[0].id.toString(); /* 默认第一个树叶签 */
        dispatch(genAction('URETAIL_MOBILE_GOODSREFER_SET_OPTIONS', { treeData, accordionKey: defaultPath, treePath: defaultPath }))
        dispatch(getFlatGoodsData(false, defaultPath, false, false))
      } else { //
        const new_tableData = options ? origin_tableData.concat(tableData) : tableData;
        const isGetNextData = !(tableData.length < 8);
        dispatch(genAction('URETAIL_MOBILE_GOODSREFER_SET_OPTIONS', { tableData: new_tableData, refreshing: false, isGetNextData, isSearchResult: (!!isSearch) }))
      }
    } else {
      cb.utils.alert(json.message, 'error')
    }
  }
}

/* 补录商品规格 */
export function selectSpec (id, product) {
  return async function (dispatch, getState) {
    // let products = getState().goodsRefer.toJS().tableData
    const config = {
      url: 'aroundStock/usedFree',
      method: 'GET',
      params: {
        itemId: id
      }
    }
    const json = await proxy(config);
    if (json.code !== 200) {
      cb.utils.alert(json.message, 'error')
      return
    }
    const dataSource = json.data.specItem;
    if (dataSource.length > 0) {
      getSkuKeyMap(dataSource, id, getState());
      // let keyMap = skuKeyMap;
      const radioKey = {};
      /* 编辑行展示选中的sku */
      if (product.specs) {
        const currentShowSpecs = product.specs.split(',');
        dataSource.forEach(newSpec => {
          for (const oldSpec of currentShowSpecs) {
            const hasIndex = newSpec.specificationItem.indexOf(oldSpec);
            if(hasIndex >= 0) radioKey[newSpec.freeId] = oldSpec
          }
        })
      }
      /* original_specStringArr  add by jinzh1 记录原始sku数组 */
      dispatch(genAction('URETAIL_MOBILE_GOODSREFER_SET_OPTIONS', { specStringArr: dataSource, original_specStringArr: dataSource, currentProduct: product, radioKey }));
    } else {
      dispatch(genAction('URETAIL_MOBILE_GOODSREFER_SET_OPTIONS', { visible: false }));
      cb.utils.alert('当前商品行没有可用sku数据', 'error')
    }
  }
}
/* add by jinzh1  构建sku对照关系 */
const getSkuKeyMap = (specItems, productId, globalState) => {
  const { tableData } = globalState.goodsRefer.toJS();
  if (!tableData) return;
  let skus = null;
  for (var i = 0; i < tableData.length; i++) {
    if (tableData[i].product == productId) {
      skus = tableData[i].productskus;
      break;
    }
  }
  if (!skus) return;
  specItems.map(item => {
    const { freeId } = item;
    const otherFreeIds = getOtherFree(freeId, specItems);
    skus.map(sku => {
      const key = productId + '&&' + freeId + '&&' + sku[freeId];
      if (!skuKeyMap[key]) skuKeyMap[key] = {};
      otherFreeIds.map(id => {
        if (!skuKeyMap[key][id]) skuKeyMap[key][id] = [];
        skuKeyMap[key][id].push(sku[id]);
      });
    });
  });
}
/* add by jinzh1  获取其它free的id集合 */
const getOtherFree = (freeId, specItems) => {
  const otherFreeIds = [];
  specItems.map(item => {
    if (freeId != item.freeId)
      otherFreeIds.push(item.freeId);
  });
  return otherFreeIds;
}
export function getKeyMap () {
  return skuKeyMap;
}
/* 选择规格后加入到购物车 */
export function specOkBtnClick (entryPoint, product, notEnd) {
  return function (dispatch, getState) {
    const { radioKey, currentProduct, stepValue, cartInfo, stashSku } = getState().goodsRefer.toJS();
    // let paramsObj = Object.assign({}, radioKey, { itemId: entryPoint === 'billing' ? currentProduct.product : currentProduct.id })
    let currentSku = {};
    /* 取sku信息（价格）显示,取完返回 */
    if (notEnd) {
      const productSkus = currentProduct.productskus;
      productSkus && productSkus.map(sku => {
        let bMatch = true;
        for (var key in radioKey) {
          if (radioKey[key] != sku[key]) bMatch = false;
        }
        if (bMatch) currentSku = sku;
      });
      // let config = {
      //   url: 'aroundStock/getItemSKUObjectByParam',
      //   method: 'POST',
      //   params: paramsObj
      // }
      // let json = await proxy(config);
      // if (json.code !== 200) {
      //   cb.utils.alert(json.message, 'error')
      //   return
      // }
      // currentSku = json.data[0];
      dispatch(genAction('URETAIL_MOBILE_GOODSREFER_SET_OPTIONS', { stashSku: currentSku }));
      return
    }
    /* 选完规格确定后，执行的操作 */
    currentSku = stashSku;
    if (entryPoint === 'billing') { // 开单界面更改规格
      dispatch(combineSpecToProduct(currentSku))
      dispatch(genAction('URETAIL_MOBILE_GOODSREFER_SET_OPTIONS', {
        visible: false, radioKey: {}, stepValue: 1,
        cartInfo, stashSku: {},
      }));
      return
    }
    const intactProduct = Object.assign({}, currentProduct, currentSku, radioKey);
    // let time = new Date();
    const specArr = [];
    for (const attr in radioKey) {
      specArr.push(radioKey[attr])
    }
    if (specArr.length > 0) intactProduct.specs = specArr.join(',')
    intactProduct.fQuantity = stepValue;
    intactProduct.exactKey = `${intactProduct.id}_${intactProduct.skuId}`
    // intactProduct.key = `${intactProduct.id}_${intactProduct.skuId}_${time.getTime()}`
    cartInfo.numObj[intactProduct.exactKey] = stepValue;
    cartInfo.numObj_withSpec[intactProduct.id] = (cartInfo.numObj_withSpec[intactProduct.id] || 0) + stepValue
    cartInfo.cartData.push(intactProduct);
    dispatch(genAction('URETAIL_MOBILE_GOODSREFER_SET_OPTIONS', {
      visible: false, radioKey: {}, stepValue: 1,
      cartInfo, stashSku: {}
    }));
  }
}

/* sku数据直接添加到购物车 */
export function skuAddToCart (value, product, callBack) {
  return function (dispatch, getState) {
    const { cartInfo } = getState().goodsRefer.toJS();
    const { numObj, cartData } = cartInfo;
    if (value == 0) {
      delete numObj[product.exactKey];
      const index = cartData.findIndex(ele => { return ele.exactKey == product.exactKey });
      if(index !== -1) cartData.splice(index, 1)
    } else {
      if (!numObj[product.exactKey]) { // 只有‘+’按钮的时候的，新增此sku
        product.fQuantity = 1;
        // product.key = `${product.id}_${product.skuId}_${time.getTime()}`
        cartInfo.cartData.push(product);
        // 更新数量map
        cartInfo.numObj[product.exactKey] = 1;
        callBack && callBack()
      } else {
        numObj[product.exactKey] = value;
        cartData.forEach(ele => {
          if (ele.exactKey == product.exactKey) ele.fQuantity = numObj[product.exactKey] // 等于value
        })
      }
    }
    dispatch(genAction('URETAIL_MOBILE_GOODSREFER_SET_OPTIONS', { cartInfo }));
  }
}

/* 购物车商品带入到开单界面 */
export function cartToBilling (isScan, dataSource) {
  return function (dispatch, getState) {
    const { cartInfo } = getState().goodsRefer.toJS();
    // let { products } = getState().product.toJS();
    // let time = (new Date()).getTime();
    const data = isScan ? dataSource : cartInfo.cartData;
    if (!data || data.length == 0) {
      dispatch(goBack());
      return;
    }
    const finalData = { sku: data }
    dispatch(dealReferReturnProducts(finalData))
    dispatch(goBack())
    dispatch(genAction('URETAIL_MOBILE_GOODSREFER_CLEAR'))
  }
}

/* 更新cartInfo */
export function updateCartInfo (row) {
  return function (dispatch, getState) {
    const { cartInfo } = getState().goodsRefer.toJS();
    const { cartData, numObj } = cartInfo;
    cartData.push(row);
    numObj[row.exactKey] = (numObj[row.exactKey] || 0) + row.fQuantity;
    dispatch(genAction('URETAIL_MOBILE_GOODSREFER_SET_OPTIONS', { cartInfo }));
  }
}

const getProxy = async function (needTree, filterPath, keyWord, options) {
  const gridDataUrl = {
    url: 'mall/bill/ref/getRefProducts',
    method: 'POST',
  };
  if (!options || !options.pageIndex) { // 全部数据或者有path过滤条件的全部数据
    gridDataUrl.params = {
      externalData: {
        showType: 'N',
        needTree: needTree,
        // keyWord: keyWord || '',
      },
      queryType: 1, /* 查询类别，1：查询商品；2：查询固定套餐 */
      keyWord: keyWord || '',
      path: filterPath,
    };
  } else { // 有path过滤和没path过滤的分页数据
    gridDataUrl.params = {
      externalData: {
        showType: 'N',
        needTree: needTree,
        // keyWord: keyWord || '',
      },
      queryType: 1,
      keyWord: keyWord || '',
      page: { pageIndex: options.pageIndex, pageSize: 8 },
      path: filterPath,
    }
  }
  const json = await proxy(gridDataUrl);
  return json
}

export const referClear = () => {
  return function (dispatch) {
    dispatch(genAction('URETAIL_MOBILE_GOODSREFER_CLEAR'))
  }
}

const editServiceData = (tableData) => {
  tableData.forEach(ele => {
    if (ele.productskus && ele.productskus.length == 1) {
      let haveSpec = false;
      for (const attr in ele.productskus[0]) {
        if (attr.includes('free')) {
          haveSpec = true;
          break;
        }
      }
      if (!haveSpec) {
        Object.assign(ele, ele.productskus[0])
      }
    }
    if (ele.skuId) ele.exactKey = `${ele.id}_${ele.skuId}`;
  })
}
