import Immutable from 'immutable';
import { genAction, proxy, getRoundValue } from '@mdf/cube/lib/helpers/util';
import { push, goBack } from 'react-router-redux'
import * as mixRedux from './mix';
import { exec as execPromotion, canOpen as canOpenPromotion } from './ExecutPromotion';
import { exec as execScene, canOpen as canOpenScene } from './discount';
import { exec as execQuote, execQuantity, canOpen as canOpenQuote, canQuantityOpen } from './quote';
import { execEdit, canOpenEdit } from './editRow';
import status from './billingStatus';
import { judgeFirstOpenPromotion } from './mix';
import { getBillingViewModel } from './config';

export const ActionItems = [
  'DoSaleByVipPoint',
  'SetPromotionFocus',
  'SceneDiscount',
  'Coupon',
  'EditRow',
  'ModifyPrice',
  'ModifyQuantity',
  'UpdateBackInfo',
  'HereAboutStocks',
  'MatchProduct', /* add by jinzh1 商品选配 */
];

const PreferentialFunc = {
  SetPromotionFocus: { key: 'Promotion', exec: execPromotion, canOpen: canOpenPromotion },
  SceneDiscount: { key: 'Scene', exec: execScene, canOpen: canOpenScene },
  ModifyPrice: { key: 'Quote', exec: execQuote, canOpen: canOpenQuote },
  ModifyQuantity: { key: 'Quantity', exec: execQuantity, canOpen: canQuantityOpen },
  EditRow: { key: 'EditRow', exec: execEdit, canOpen: canOpenEdit }
};
const $$initialState = Immutable.fromJS({
  actionData: [],
  modalKey_Current: '',
  modalKey_Data: {
    ModifyQuantity: 'ModifyQuantity', // 修改数量
    DoSaleByVipPoint: 'DoSaleByVipPoint', // 积分抵扣
    Coupon: 'Coupon', // 优惠券
    UpdateBackInfo: 'UpdateBackInfo', // 退货信息
    HereAboutStocks: 'HereAboutStocks', // 周边库存
    SceneDiscount: 'SceneDiscount', // 现场折扣
    SetPromotionFocus: 'SetPromotionFocus', // 执行促销
    ModifyPrice: 'ModifyPrice', // 改零售价
    ClearReceipt: 'ClearReceipt', // 新开单
    EditRow: 'EditRow', // 改行
    MatchProduct: 'MatchProduct', /* add by jinzh1 商品选配 */
  },

  modalData: {
    UpdateBackInfo:
      {
        title: '退货信息',
        params: {},
        backReason: []
      },
    ModifyQuantity:
      {
        title: '商品数量',
      },
    DoSaleByVipPoint:
      {
        bHasEffectiveData: false, // 是否有有效数值
        bHasEditData: false, // 是否已经初始化当前编辑数值
        title: '积分抵扣',
        bCoupon: false,
        bpromotion: false,
        data: {
          memberpoints: 0, // 会员所拥有的积分
          memo: '10积分抵1元', // 否 备注使用积分抵款规则描述
          mpoint: 0, // M积分
          nmoney: 0, //  N元
          points: 0, // 会员当前要使用的积分，初次调用=最大可用积分数,二次修改后调用返回传入的积分数
          moneyuse: 0.00, // 否 抵款金额
          pointscanuse: 0,
          maxpoints: 0, // 按照规则每单最大使用积分数，二次修改不可大于此积分数
          minpoints: 0, // 按照规则每单最少使用积分数，二次修改0或小于这个数都不用调服务，直接不用DoSaleByVipPoint
        },
        editData:
          {
            memberpoints: 0, // 会员所拥有的积分
            memo: '10积分抵1元', // 否 备注使用积分抵款规则描述
            mpoint: 0, // M积分
            nmoney: 0, //  N元
            points: 0, // 会员当前要使用的积分，初次调用=最大可用积分数,二次修改后调用返回传入的积分数
            moneyuse: 0.00, // 否 抵款金额
            pointscanuse: 0,
            maxpoints: 0, // 按照规则每单最大使用积分数，二次修改不可大于此积分数
            minpoints: 0, // 按照规则每单最少使用积分数，二次修改0或小于这个数都不用调服务，直接不用DoSaleByVipPoint
          },
        voucherData: {
          voucherDataBefore: {},
          voucherDataAfter: {},
        }
      },
    Coupon:
      {
        bHasEffectiveData: false, // 是否有有效数值
        bHasEditData: false,
        title: '优惠券',
        inputErrInfo: '请输入正确的卡券号码',
        inputErrInfoDisplay: '',
        mId: '',
        storeId: '',
        couponKey: '',
        data: {
          CouponList: []
        },
        editData: {
          CouponList: []
        },
        voucherData: {
          voucherDataBefore: {},
          voucherDataAfter: {},
        }
      },
    HereAboutStocks:
      {
        mId: '-1',
        title: '周边库存',
        storeId: '',
        storeName: '',
        itemId: '',
        itemName: '',
        pageIndex: '',
        pageSize: '',
        pageCount: '',
        recordCount: '',
        orderBy: '',
        usedFree: [],
        aroundStock: {},
        selValues: {},

      },
    MatchProduct: /* add by jinzh1 商品选配 */
      {
        vm: null,
        viewmeta: null,
      }
  }
})

// reducer
export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_ACTION_MERGE':
      return $$state.merge(action.payload)
    case 'PLATFORM_UI_BILLING_LOAD_BOTTOM_ACTION':
      return $$state.set('actionData', action.payload);
    case 'PLATFORM_UI_BILLING_LOAD_ACTION_AUTH':/* 开单权限 */
      return $$state.set('authData', action.payload);
    case 'PLATFORM_UI_BILLING_Action_ReturnNothing':
      return $$state;
    case 'PLATFORM_UI_BILLING_Action_ShowModal':
    {
      return inner_ShowModal($$state, action.payload);
    }
    case 'PLATFORM_UI_BILLING_Action_Jifendikou_HandleOk':
    {
      const $state = $$state.toJS();
      $state.modalData[$state.modalKey_Data.DoSaleByVipPoint] = action.payload;
      // let point = $state.modalData[$state.modalKey_Data.DoSaleByVipPoint];
      // let data = action.payload.data;
      // common_CopyData(data, point.data, $state);
      // point.data.pointscanuse = point.editData.pointscanuse;
      // point.voucherData.voucherDataAfter = action.payload.voucherDataAfter;
      // $state.modalData.DoSaleByVipPoint.bHasEffectiveData = true;
      // $state.modalData.DoSaleByVipPoint.bHasEditData = false;
      $state.modalKey_Current = '';
      return Immutable.fromJS($state);
    }
    case 'PLATFORM_UI_BILLING_Action_HandleCancel':
    {
      const $state = $$state.toJS();
      const modalKey = $state.modalKey_Current;
      if ($state.modalData[modalKey] && $state.modalData[modalKey].bHasEditData)
        $state.modalData[modalKey].bHasEditData = false;
      if (modalKey == $state.modalKey_Data.Coupon) {
        $state.modalData[modalKey].couponKey = '';
        $state.modalData[modalKey].inputErrInfoDisplay = '';
      }
      else if (modalKey == $state.modalKey_Data.HereAboutStocks) {
        $state.modalData[modalKey].usedFree = [];
        $state.modalData[modalKey].aroundStock = {};
        $state.modalData[modalKey].selValues = {};
      }
      $state.modalKey_Current = '';
      $state.modalOpening = false; /* lz 托利多点击多次确定按钮 */
      return Immutable.fromJS($state);
    }
    case 'PLATFORM_UI_BILLING_Action_LoadEditDataFromData':
    {
      return inner_LoadEditDataFromData($$state, action.payload);
    }
    case 'PLATFORM_UI_BILLING_Action_Jifendikou_InitData':
    {
      return inner_Jifendikou_InitData($$state, action.payload);
    }
    case 'PLATFORM_UI_BILLING_Action_Youhuiquan_InitData':
    {
      return inner_Youhuiquan_InitData($$state, action.payload);
    }
    case 'PLATFORM_UI_BILLING_Action_UpdateBackInfo_InitData':
    {
      return inner_UpdateBackInfo_InitData($$state, action.payload);
    }
    case 'PLATFORM_UI_BILLING_Action_Zhoubiankucun_InitData':
    {
      return inner_Zhoubiankucun_InitData($$state, action.payload);
    }
    case 'PLATFORM_UI_BILLING_Action_Zhoubiankucun_Restore':
    {
      const $state = $$state.toJS();
      const aroundStock = action.payload.aroundStock;
      const data = $state.modalData.HereAboutStocks;
      data.pageIndex = aroundStock.pageIndex;
      data.pageCount = aroundStock.pageCount;
      data.pageSize = 15;
      data.recordCount = aroundStock.recordCount;
      data.aroundStock = aroundStock.data;
      data.selValues = {};
      return Immutable.fromJS($state);
    }
    case 'PLATFORM_UI_BILLING_Action_Zhoubiankucun_ValueChange':
    {
      const $state = $$state.toJS();
      // let params = action.payload.params;
      const aroundStock = action.payload.aroundStock;
      const data = $state.modalData.HereAboutStocks;
      if (action.payload.fieldName) {
        if (action.payload.bSelValues) {
          data.selValues[action.payload.fieldName] = action.payload.fieldValue;
        }
        else
          data[action.payload.fieldName] = action.payload.fieldValue;
      }
      if (aroundStock) {
        data.pageIndex = aroundStock.pageIndex;
        data.pageCount = aroundStock.pageCount;
        data.recordCount = aroundStock.recordCount;
        data.aroundStock = aroundStock.data;
      }
      return Immutable.fromJS($state);
    }
    case 'PLATFORM_UI_BILLING_Action_Youhuiquan_NoUserInit':
    {
      return inner_Youhuiquan_NoUserInitData($$state, action.payload);
    }
    case 'PLATFORM_UI_BILLING_Action_Youhuiquan_ChooseCoupon':
    {
      return inner_Youhuiquan_ChooseCoupon($$state, action.payload);
    }
    case 'PLATFORM_UI_BILLING_Action_Youhuiquan_ChangeCouponKey':
    {
      const $state = $$state.toJS();
      $state.modalData.Coupon.inputErrInfoDisplay = '';
      $state.modalData.Coupon.couponKey = action.payload.couponKey;
      return Immutable.fromJS($state);
    }
    case 'PLATFORM_UI_BILLING_Action_Youhuiquan_InputCoupon':
    {
      return inner_Youhuiquan_InputCoupon($$state, action.payload);
    }
    case 'PLATFORM_UI_BILLING_Action_Youhuiquan_InputCouponError':
    {
      const $state = $$state.toJS();
      $state.modalData.Coupon.inputErrInfoDisplay = $state.modalData.Coupon.inputErrInfo;
      return Immutable.fromJS($state);
    }
    case 'PLATFORM_UI_BILLING_Action_Youhuiquan_HandleOk':
    {
      return inner_Youhuiquan_HandleOk($$state, action.payload);
    }
    case 'PLATFORM_UI_BILLING_Action_Jifendikou_PointChange':
    {
      return inner_Jifendikou_PointChange($$state, action.payload);
    }
    case 'PLATFORM_UI_BILLING_Action_clearRedux':
    {
      return inner_ClearRedux($$state, action.payload);
    }
    case 'PLATFORM_UI_BILLING_CLEAR':// 公共清理
    {
      return inner_ClearRedux($$state, action.payload);
    }
    case 'PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange':
    {
      const $state = $$state.toJS();
      const params = $state.modalData.UpdateBackInfo.params;
      const changeValues = action.payload.changeValues;
      changeValues.forEach((ele) => {
        // if (params.hasOwnProperty(ele.fieldName))
        params[ele.fieldName] = ele.fieldValue;
      });
      return Immutable.fromJS($state);
    }

    case 'PLATFORM_UI_BILLING_Action_UpdateBackInfo_UpdateParams':
    {
      const $state = $$state.toJS();
      // let params = $state.modalData.UpdateBackInfo.params;
      // params = Object.assign(params, action.payload)
      return Immutable.fromJS($state);
    }

    case 'PLATFORM_UI_BILLING_Action_UpdateBackInfo_FillBackReason':
    {
      const $state = $$state.toJS();
      $state.modalData.UpdateBackInfo.backReason = action.payload.backReason;
      return Immutable.fromJS($state);
    }
    case 'PLATFORM_UI_BILLING_Action_UpdateBackInfo_LoopNext':
    {
      const $state = $$state.toJS();
      const params = $state.modalData.UpdateBackInfo.params;
      const backArray = $state.modalData.UpdateBackInfo.params.backArray;
      params.loopNum = params.loopNum + 1;
      inner_UpdateBackInfo_SetLoopData(params, backArray, params.loopNum);
      return Immutable.fromJS($state);
    }
    case 'PLATFORM_UI_BILLING_Action_UpdateBackInfo_SetCheckParams':
    {
      const $state = $$state.toJS();
      $state.modalData.UpdateBackInfo.params = action.payload.params;
      $state.modalData.UpdateBackInfo.params.isCheckErrRender = true;

      return Immutable.fromJS($state);
    }
    case 'PLATFORM_UI_BILLING_ACTION_MODIFY_MODALDATA_QUANTITY':
      return $$state.merge({ modalData: action.payload });

    case 'PLATFORM_UI_BILLING_RESTORE_PREFERENTIAL_COUPON_BACKUP':
    {
      const $state = $$state.toJS();
      $state.modalData.Coupon = action.payload;
      return Immutable.fromJS($state);
    }
    case 'PLATFORM_UI_BILLING_RESTORE_PREFERENTIAL_POINT_BACKUP':
    {
      const $state = $$state.toJS();
      $state.modalData.DoSaleByVipPoint = action.payload;
      return Immutable.fromJS($state);
    }
    case 'PLATFORM_UI_BILLING_MERGER_MODALDATA':
    {
      const $state = $$state.toJS();
      $state.modalData = action.payload;
      return Immutable.fromJS($state);
    }
    default:
      return $$state;
  }
}

function inner_ClearRedux (state, payload) {
  const $state = state.toJS();
  const $modalData = $state.modalData;
  const $modalKey_Data = state.get('modalKey_Data').toJS();
  const modalKey = payload && payload.modalKey_Current;
  let $data;
  if (modalKey == undefined || modalKey == $modalKey_Data.DoSaleByVipPoint) {
    $data = $modalData && $modalData[$modalKey_Data.DoSaleByVipPoint];
    if ($data) {
      $data.bHasEffectiveData = false;
      $data.bHasEditData = false;
      $data.voucherData.voucherDataBefore = {};
      $data.voucherData.voucherDataAfter = {};
    }
    // if (payload && payload.bCancel)
    $state.modalKey_Current = '';
  }
  if (modalKey == undefined || modalKey == $modalKey_Data.Coupon) {
    $data = $modalData && $modalData[$modalKey_Data.Coupon];
    if ($data) {
      $data.bHasEffectiveData = false;
      $data.bHasEditData = false;
      $data.voucherData.voucherDataBefore = {};
      $data.voucherData.voucherDataAfter = {};
      $data.data.CouponList = [];
      $data.editData.CouponList = [];
    }
    // if (payload && payload.bCancel)
    $state.modalKey_Current = '';
  }
  if (modalKey == undefined || modalKey == $modalKey_Data.HereAboutStocks) {
    $data = $modalData && $modalData[$modalKey_Data.HereAboutStocks];
    if ($data) {
      $data.bHasEffectiveData = false;
      $data.bHasEditData = false;
    }
    // if (payload && payload.bCancel)
    $state.modalKey_Current = '';
  }
  return Immutable.fromJS($state);
}

function inner_ShowModal (state, payload) {
  const $state = state.toJS();
  $state.modalKey_Current = payload.modalKey_Current;
  if ($state.modalData[payload.modalKey_Current] && $state.modalData[payload.modalKey_Current].bHasEditData && $state.modalData[payload.modalKey_Current].bHasEditData == false)
    $state.modalData[payload.modalKey_Current].bHasEditData = true;
  return Immutable.fromJS($state);
}

function inner_LoadEditDataFromData ($$state, payload) {
  const state = $$state.toJS();
  const modalKey = payload.modalKey_Current;
  const modalData = state.modalData[modalKey];
  const editData = modalData.editData;
  const data = modalData.data;
  state.modalKey_Current = modalKey;
  common_CopyData(data, editData, $$state);
  modalData.bHasEditData = true;
  return Immutable.fromJS(state);
}
// function getCommonInfo() {
//   let { storeId, gradeId, userStores } = cb.rest.AppContext.user;
//   return { storeId, gradeId, userStores };
// }

function inner_Jifendikou_InitData (state, payload) {
  const $state = state.toJS();
  const $data = $state.modalData[payload.modalKey_Current];
  $data.bCoupon = payload.bCoupon;
  $data.bpromotion = payload.bpromotion;
  $data.bHasEditData = true;
  common_CopyData(payload.data, $data.editData, state);
  $data.editData.pointscanuse = $data.editData.points;
  $data.voucherData.voucherDataBefore = payload.voucherDataBefore;
  $data.voucherData.voucherDataAfter = payload.voucherDataAfter;
  $state.modalKey_Current = payload.modalKey_Current;
  return Immutable.fromJS($state);
}

function inner_UpdateBackInfo_SetLoopData (params, backArray, loopNum) {
  const curRow = backArray[loopNum];
  const options = mixRedux.getOptions();
  params.fCanCoQuantity = curRow.fCanCoQuantity;
  // if (!isNaN(curRow.fQuantity) && curRow.fQuantity != "" && curRow.fQuantity > 0)
  //   params.fQuantity = 0 - Number(curRow.fQuantity);
  // else
  params.fQuantity = curRow.fQuantity;
  if (cb.rest.terminalType == 3) params.fQuantity = parseFloat(params.fQuantity).toFixed(options.numPoint_Quantity.value);
  params.fQuantity_bOk = true;
  params.fQuotePrice_bOk = true;
  params.fPrice_bOk = true;
  params.refuseReason_bOk = true;
  params.saleDate_bOk = true;
  params.goldPrice_bOk = true;
  params.goldWeight_bOk = true;
  params.itemId = curRow.product;
  params.itemName = curRow.product_cName;
  params.specs = curRow.specs;
  params.fQuotePrice = curRow.fQuotePrice;
  params.fPrice = curRow.fPrice;
  if (cb.rest.terminalType == 3) params.fPrice = parseFloat(params.fPrice).toFixed(options.monovalentdecimal.value);
  params.foldPrice = curRow.foldPrice;
  params.fMoney = curRow.fMoney;
  if (cb.rest.terminalType == 3) params.fMoney = parseFloat(params.fMoney).toFixed(options.amountofdecimal.value);
  params.iBackid = curRow.iBackid;
  params.iBackid_reason = curRow.iBackid_reason;
  params.saleDate = curRow.dCoSaleDate;
  params.bFixedCombo = curRow.bFixedCombo != undefined && curRow.bFixedCombo == true;
  params.bFixedComboHeader = params.bFixedCombo && curRow.title != undefined && curRow.title != '';
  params.bFixedComboBody = params.bFixedCombo && params.bFixedComboHeader == false;
  if (params.customerBusinessType == 2) {
    let tmpStr = '';
    const productDefine = 'product_productProps!define'; // 商品自定义项
    const skuDefine = 'product_productSkuProps!define'; // SKU自定义项
    const detailDefine = 'retailVouchDetailCustom!define'; // 表体自定义项
    // 是否回收品 商品自定义项2
    if (curRow[productDefine + '2'] === '是')
      params.goldIsRecyclePruduct = true;
    else
      params.goldIsRecyclePruduct = false;
    /* add by jinzh1  是否序列号商品 */
    params.product_productOfflineRetail_isSerialNoManage = curRow.product_productOfflineRetail_isSerialNoManage;
    // 售价计算方式为按克 按件   取自SKU自定义项，取不到时取自商品自定义项 SKU自定义项4或商品自定义项1
    tmpStr = curRow[skuDefine + '4'] ? curRow[skuDefine + '4'] : curRow[productDefine + '1'];
    params.goldPriceCalcType = tmpStr

    // 重量：默认表体行数量  单据体自定义项1
    params.goldWeight = curRow[detailDefine + '1'];
    const scaledecimal = options.scaledecimal ? options.scaledecimal.value : 0;
    params.goldWeight = isNaN(parseFloat(params.goldWeight)) ? '' : getRoundValue(params.goldWeight, scaledecimal);

    // 金价：默认表体行金价，只读  单据体自定义项2
    params.goldPrice = curRow[detailDefine + '2'];

    // 回收损耗率%：大于等于零，小于100，可改  单据体自定义项7
    params.goldRecycleLossRate = curRow[detailDefine + '7'];

    // 回收工费：可改，大于零 商品自定义项3
    params.goldRecycleFee = curRow[productDefine + '3'];

    // 实退金额：按公式计算，只读
    params.goldReturnMoney = curRow.fMoney;

    // 销售工费计价方式 枚举：按件、按克 可空 取自SKU自定义项 SKU自定义项2
    params.goldSaleFeeCalcType = curRow[skuDefine + '2'];

    // 销售工费 单据体自定义项3
    params.goldSaleFee = curRow[detailDefine + '3'];

    // 折扣率%   单据体自定义项6
    // params.goldFeeDiscountRate = curRow['fDiscountRate'];
    params.goldFeeDiscountRate = calculate_Divide(curRow.fPrice, curRow.foldPrice, 4) * 100;
    if (cb.rest.terminalType == 3) params.goldFeeDiscountRate = parseFloat(params.goldFeeDiscountRate).toFixed(2);

    // 折扣额  单据体自定义项5
    params.goldFeeDiscountMoney = curRow.fCoDiscount;
    if (cb.rest.terminalType == 3) params.goldFeeDiscountMoney = parseFloat(params.goldFeeDiscountMoney || 0).toFixed(options.amountofdecimal.value);
  }
  params.interfaceControlType = 0;// 界面控制方式 默认金一之前
  if (params.customerBusinessType == 2) {
    if (params.returnProductType == 2 && params.goldIsRecyclePruduct == true && params.goldPriceCalcType == '按克') {
      // 若当前商品行为非原单退货行，“回收品”为是且售价计算方式为按克的，退货信息显示内容：
      params.interfaceControlType = 1;
    }
    else if (params.returnProductType == 2 && params.goldIsRecyclePruduct == false && params.goldPriceCalcType == '按克') {
      // 若当前商品行为非原单退货行，“回收品”为否且商品的售价计算方式为“按克”，则退货信息显示如下：
      params.interfaceControlType = 2;
    }
    else if (params.returnProductType == 4) { /* add by jinzh1 电商退货 */
      params.interfaceControlType = 4;
    }
    else {
      params.interfaceControlType = 3;
    }
  }
}

function inner_Youhuiquan_HandleOk (state, payload) {
  const $state = state.toJS();
  // let $data = $state.modalData[$state.modalKey_Data.Coupon];
  // $data.voucherData.voucherDataAfter = payload.voucherDataAfter;
  // $data.bHasEffectiveData = true;
  // $data.bHasEditData = false;
  // $data.couponKey = ""
  // $data.editData.inputErrInfoDisplay = "";
  // common_CopyData($data.editData, $data.data, $state);
  $state.modalData[$state.modalKey_Data.Coupon] = payload;
  $state.modalKey_Current = '';
  return Immutable.fromJS($state);
}
function inner_Youhuiquan_InputCoupon (state, payload) {
  const $state = state.toJS();
  const $data = $state.modalData[$state.modalKey_Data.Coupon];
  const couponEle = payload.json.data.coupon;
  inner_Youhuiquan_SetDisplayData(couponEle);
  couponEle.displaybHandInput = true;
  couponEle.displaySelected = true;
  $data.editData.CouponList.push(couponEle);
  $data.couponKey = '';
  return Immutable.fromJS($state);
}

function inner_Youhuiquan_SetDisplayData (ele) {
  ele.displaySelected = false;
  ele.displayId = ele.sn;
  // ele.displayTypeName = ele.type_name ? ele.type_name : ele.title; //"满" + (ele.start_amount ? ele.start_amount.toString() : " ") + "减" + (ele.reduce_amount ? ele.reduce_amount.toString() : " ");
  if (ele.type == 1) {
    ele.displayTypeName = '代金券';
    ele.displayOrder = 30;
  }
  else if (ele.type == 2) {
    ele.displayTypeName = '折扣券';
    ele.displayOrder = 20;
  }
  else if (ele.type == 5) {
    ele.displayTypeName = '记次券';
    ele.displayOrder = 40;
  }
  else if (ele.type == 6) {
    ele.displayTypeName = '兑换券';
    ele.displayOrder = 10;
  }
  else {
    ele.displayTypeName = 'ele.type = ' + ele.type.toString();
    ele.displayOrder = 50;
  }
  ele.displayCaption1 = ele.title;
  ele.displayCaption2 = ele.title;
  ele.displayCode = ele.sn;
  if (ele.exp_date)
    ele.displayExp_date = new Date(ele.exp_date).format('yyyy.MM.dd');
  // ele.displayDateDesc = "截止日期:" + new Date(ele.exp_date).format('yyyy.MM.dd');
  ele.displayDateDesc = new Date(ele.effect_date).format('yyyy.MM.dd') + '-' + new Date(ele.exp_date).format('yyyy.MM.dd');
  ele.displayMoney = ele.reduce_amount ? ele.reduce_amount : 0;
  ele.displayRemainTimes = ele.remain_times;
  ele.displayAvlTimes = ele.hasOwnProperty('avl_times') ? ele.avl_times : ele.remain_times;
  ele.displaySelectTimes = ele.select_times;
  // 折扣券  type=2
  ele.displayDiscount = ele.discount;
  // 兑换券
  ele.displayChangeCount = ele.remain_times;
  // ele.displayTotalCount = ele.amount;
  ele.displaybHandInput = ele.displaybHandInput || false;
  ele.displayType = ele.type;
  ele.displayDisabledBySys = true;
  if (ele.buse)
    ele.displayDisabledBySys = false;
}
function inner_Youhuiquan_ChooseCoupon (state, payload) {
  const $state = state.toJS();
  const payLoadCoupons = payload && payload.data && payload.data.coupons;
  const $couponData = $state.modalData[$state.modalKey_Data.Coupon];
  const $couponList = $couponData.editData.CouponList;
  if ($couponList) {
    $couponList.forEach((ele) => {
      if (ele.sn == payload.displayId) {
        if (payload.bChoose == true) {
          const coupon = payload.data.coupon;
          inner_Youhuiquan_SetDisplayData(coupon);
          coupon.displaySelected = payload.bChoose;
          var index = $couponList.indexOf(ele)
          $couponList.splice(index, 1, coupon);
          if ($couponData.couponKey == payload.displayId)
            $couponData.couponKey = '';
        }
        else {
          if (ele.displaybHandInput == true) {
            // $couponList.pop(ele);
            var index2 = $couponList.indexOf(ele)
            $couponList.splice(index2, 1);
          }
          else if (ele.displayType == 5) {
            ele.avl_times = ele.remain_times;
            ele.select_times = 0;
            ele.displaySelectTimes = ele.select_times;
            ele.displayAvlTimes = ele.avl_times;
            ele.displaySelected = payload.bChoose;
          }
          else {
            ele.displaySelected = payload.bChoose;
          }
        }
      }
      else if (payload.bChoose == true && ele.displaySelected == true && payLoadCoupons && payLoadCoupons.length > 0) {
        payLoadCoupons.forEach((ele2) => {
          if (ele.sn == ele2.sn) {
            if (ele.reduce_amount != ele2.reduce_amount) {
              ele.reduce_amount = ele2.reduce_amount;
              ele.displayMoney = ele.reduce_amount ? ele.reduce_amount : 0;
            }
            if (ele.rangecal != ele2.rangecal) {
              ele.rangecal = ele2.rangecal;
            }
          }
        });
      }
    })
  }
  return Immutable.fromJS($state);
}
function inner_Zhoubiankucun_InitData (state, payload) {
  const $state = state.toJS();
  const $data = $state.modalData[payload.modalKey_Current];
  const params = payload.params;
  const usedFree = payload.usedFree;
  const aroundStock = payload.aroundStock;

  $data.mId = params.mId;
  $data.title = params.title;
  $data.storeId = params.storeId;
  $data.storeName = params.storeName;
  $data.itemId = params.itemId;
  $data.itemName = params.itemName;
  $data.pageSize = params.pageSize;
  $data.orderBy = params.orderBy;

  $data.pageIndex = aroundStock.pageIndex;
  $data.pageCount = aroundStock.pageCount;
  $data.recordCount = aroundStock.recordCount;
  $data.usedFree = usedFree.specItem;
  $data.aroundStock = aroundStock.data;
  $data.selValues = {};
  // 由于金一项目将单件条码放入规格，若用条码找周边店存，肯定找不到，因此按金一要求，默认值都为空
  // if (usedFree.defaultItem) {
  //   $data.selValues = usedFree.defaultItem;
  // }
  $state.modalKey_Current = payload.modalKey_Current;
  return Immutable.fromJS($state);
}
function inner_Youhuiquan_NoUserInitData (state, payload) {
  const $state = state.toJS();
  const $data = $state.modalData[payload.modalKey_Current];
  $data.mId = payload.mId;
  $data.storeId = payload.storeId;
  $data.bPoint = payload.bPoint;
  $data.bpromotion = payload.bpromotion;
  $data.bHasEditData = true;
  $data.editData.CouponList = [];
  $data.voucherData.voucherDataBefore = payload.voucherDataBefore;
  $state.modalKey_Current = payload.modalKey_Current;
  return Immutable.fromJS($state);
}
function inner_UpdateBackInfo_InitData (state, payload) {
  const $state = state.toJS();
  let current = payload.modalKey_Current;
  if (current == 'EditRow') current = 'UpdateBackInfo';
  const $data = $state.modalData[current];
  $data.params = payload.params;
  $data.params.bOk = true;
  $data.params.fQuantity_bOk = true;
  $data.params.fQuotePrice_bOk = true;
  $data.params.goldPrice_bOk = true;
  $data.params.fmoney_bOk = true;
  $data.params.goldWeight_bOk = true;
  $data.params.fPrice_bOk = true;
  $data.params.refuseReason_bOk = true;
  $data.params.saleDate_bOk = true;
  $data.params.loopNum = 0;
  inner_UpdateBackInfo_SetLoopData($data.params, $data.params.backArray, $data.params.loopNum);
  $state.modalKey_Current = current;
  return Immutable.fromJS($state);
}

function inner_Youhuiquan_InitData (state, payload) {
  const $state = state.toJS();
  const $data = $state.modalData[payload.modalKey_Current];
  // let sourceData = payload.json.data;
  const sourceData = payload.data;
  if (sourceData) {
    sourceData.forEach((ele) => {
      if (ele.hasOwnProperty('displaySelected') == false) {
        inner_Youhuiquan_SetDisplayData(ele);
      }
    });
    $data.editData.CouponList = sourceData;
  }
  else {
    $data.editData.CouponList = [];
  }
  $data.mId = payload.mId;
  $data.storeId = payload.storeId;
  $data.bPoint = payload.bPoint;
  $data.bpromotion = payload.bpromotion;
  $data.bHasEditData = true;
  $data.voucherData.voucherDataBefore = payload.voucherDataBefore;
  $state.modalKey_Current = payload.modalKey_Current;
  return Immutable.fromJS($state);
}
function inner_Jifendikou_PointChange (state, payload) {
  const $modalData = state.get('modalData').toJS();
  const editData = $modalData.DoSaleByVipPoint.editData;
  const value = payload.value;
  if (isNaN(value) == false) {
    if (value > editData.pointscanuse) {
      editData.points = editData.pointscanuse;
    }
    else {
      editData.points = value;
    }
    editData.moneyuse = Math.round(editData.points * editData.nmoney * 100 / editData.mpoint) / 100;
  }
  return state.set('modalData', Immutable.fromJS($modalData))
}
function common_CopyData (sourceData, destData, state, subKey) {
  // subKey 进一步区分不同复制

  for (var obj in sourceData) {
    if (destData.hasOwnProperty(obj))
      destData[obj] = sourceData[obj];
  }
}
function common_NotifyMainPage (dispatch, $state, voucherData, reduxData) {
  const modalKey_Current = $state.modalKey_Current;
  let key = '';
  if (modalKey_Current == $state.modalKey_Data.Coupon)
    key = 'Coupon';
  else if (modalKey_Current == $state.modalKey_Data.DoSaleByVipPoint)
    key = 'Point';
  if (key) {
    dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_PREFERENTIAL_UPDATE_PRODUCTS', { key, value: voucherData, backup: reduxData }));
  }
  else {
    cb.utils.alert('向主界面发送数据参数不正确。', 'error')
  }

  // let modalKey_Current = $state.modalKey_Current;
  // let key = "";
  // let curData = data ? data : $state.modalData[modalKey_Current].voucherData.voucherDataAfter;
  // let backup = $state.modalData[modalKey_Current];
  // if (modalKey_Current == $state.modalKey_Data.Coupon)
  //   key = "Coupon";
  // else if (modalKey_Current == $state.modalKey_Data.DoSaleByVipPoint)
  //   key = "Point";
  // if (key && curData) {
  //   dispatch(genAction('PLATFORM_UI_BILLING_EXECUTE_PREFERENTIAL_UPDATE_PRODUCTS', { key, value: curData, backup: backup }));
  // }
  // else {
  //   cb.utils.alert("向主界面发送数据参数不正确。", 'error')
  // }
}
// function inner_Jifendikou_HandleOk(state, payload) {

// }

export function clearActionData () {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_LOAD_BOTTOM_ACTION', []));
  }
}
export function clearRedux (modalKey_Current) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_Action_clearRedux', { modalKey_Current: modalKey_Current }));
  }
}
export function loopShowUpdateBackInfo (payLoad) {
  return function (dispatch, getState) {

  }
}
/* add by jinzh1 校验按钮权限 */
export function checkButtonAuth (modalKey_Current, globalState, notPop) {
  const authData = globalState.actions.toJS().authData;
  const userName = globalState.user.toJS().name;
  let hasAuth = true; let errMsg = '';
  authData.map(auth => {
    if (auth.key == modalKey_Current) {
      hasAuth = auth.isHasAuth;
      errMsg = auth.name;
    }
  });
  if (!hasAuth && !notPop)
    cb.utils.alert(`操作员${userName}没有${errMsg}按钮的功能权限，不能操作！`, 'error');
  return hasAuth;
}

/* o2o可执行操作的控制 */
export const getOnlineCondition = (modalKey_Current, billingStatus, globalState) => {
  const infoData = globalState.uretailHeader.get('infoData')
  const onlineDeliverModify = Immutable.Map.isMap(infoData) ? infoData.get('bDeliveryModify') : infoData.bDeliveryModify
  if (billingStatus == 'OnlineBill') {
    if (!onlineDeliverModify)
      return (modalKey_Current !== 'InputEmployee' && modalKey_Current !== 'EditRow' && modalKey_Current != 'HereAboutStocks')
    else {
      const focusedRow = globalState.product.get('focusedRow')
      const iRelatingRetailDetailId = Immutable.Map.isMap(focusedRow) ? focusedRow.get('iRelatingRetailDetailId') : focusedRow.iRelatingRetailDetailId;
      if (iRelatingRetailDetailId) // 原单行
        return (modalKey_Current != 'ModifyQuantity' && modalKey_Current !== 'InputEmployee' && modalKey_Current !== 'EditRow' && modalKey_Current != 'HereAboutStocks')
      return (modalKey_Current != 'ModifyQuantity' && modalKey_Current != 'ModifyPrice' && modalKey_Current !== 'InputEmployee' && modalKey_Current !== 'EditRow' && modalKey_Current != 'HereAboutStocks')
    }
  } else if (billingStatus == 'OnlineBackBill') {
    return (modalKey_Current !== 'InputEmployee' && modalKey_Current !== 'EditRow' && modalKey_Current != 'HereAboutStocks')
  } else {
    return false
  }
}

/* add by jinzh1 针对移动端的交互  抽取校验公共方法 */
export function checkShowModal (modalKey_Current, globalState) {
  return function (dispatch, getState) {
    if (modalKey_Current == 'SetPromotionFocus' && judgeFirstOpenPromotion('get')) {
      judgeFirstOpenPromotion('set', false)
    }
    if (modalKey_Current != 'SceneDiscount' && modalKey_Current != 'ClearReceipt' && modalKey_Current != 'EditRow' && modalKey_Current != 'ModifyQuantity') {
      const hasAuth = checkButtonAuth(modalKey_Current, globalState);
      if (!hasAuth) return false;
    }

    const billingStatus = globalState.uretailHeader.toJS().billingStatus;
    const onLineBillCondition = getOnlineCondition(modalKey_Current, billingStatus, globalState)
    if (onLineBillCondition) {
      /* 王久龄加周边库存 */
      cb.utils.alert('电商订单不支持该种操作！', 'error');
      return false;
    }
    return true;
  }
}

// 显示模态框
export function showModal (modalKey_Current, loopBackArray, numInputChange) {
  return function (dispatch, getState) {
    const globalState = getState();
    if (!beforeExecBottomActionLogic(modalKey_Current)) return
    if (!dispatch(checkShowModal(modalKey_Current, globalState))) return;

    const $state = globalState.actions.toJS();
    const params = getShowModalParams(modalKey_Current, globalState, loopBackArray);
    if (modalKey_Current == $state.modalKey_Data.DoSaleByVipPoint) {
      mixRedux.canExecute(globalState, 'Point', function () {
        Jifendikou_ShowModalCheck(modalKey_Current, dispatch, globalState, params);
      });
    }
    else if (modalKey_Current == $state.modalKey_Data.Coupon) {
      mixRedux.canExecute(globalState, 'Coupon', function () {
        Youhuiquan_ShowModalCheck(modalKey_Current, dispatch, globalState, params);
      });
    }
    else if (modalKey_Current == $state.modalKey_Data.HereAboutStocks) {
      Zhoubiankucun_ShowModalCheck(modalKey_Current, dispatch, globalState, params);
    }
    else if (modalKey_Current == $state.modalKey_Data.UpdateBackInfo) {
      UpdateBackInfo_ShowModalCheck(modalKey_Current, dispatch, globalState, params);
    }
    else if (modalKey_Current == $state.modalKey_Data.EditRow) {
      EditRow_ShowModalCheck(modalKey_Current, dispatch, globalState, params);
    }
    /* add by jinzh1 商品选配 */
    else if (modalKey_Current == $state.modalKey_Data.MatchProduct) {
      buildMatchProduct(modalKey_Current, dispatch, globalState, params);
    }
    else {
      const currentFunc = PreferentialFunc[modalKey_Current];
      if (!currentFunc) {
        cb.utils.alert('正在开发中，敬请期待')
        return;
      }
      mixRedux.canExecute(globalState, currentFunc.key, function () {
        if (numInputChange) {
          currentFunc.canOpen(dispatch, globalState, function () {
            dispatch(currentFunc.exec())
          }, 'inputNum');
        } else {
          currentFunc.canOpen(dispatch, globalState, function () {
            dispatch(genAction('PLATFORM_UI_BILLING_Action_ShowModal', { modalKey_Current }));
          });
        }
      }, dispatch);
    }
  }
}
/* add by jinzh1 组织退货信息数据，翻页用 */
export function backInfoParams () {
  return function (dispatch, getState) {
    const params = getShowModalParams('UpdateBackInfo', getState());
    UpdateBackInfo_ShowModalCheck('UpdateBackInfo', dispatch, getState(), params)
  }
}

function getShowModalParams (modalKey_Current, globalState, loopBackArray) {
  const actionsState = globalState.actions.toJS();
  const memberState = globalState.member.toJS();
  const productState = globalState.product.toJS();
  const userState = globalState.user.toJS();
  const uretailHeaderState = globalState.uretailHeader.toJS();
  const modalKey_Data = actionsState.modalKey_Data;
  const modalData = actionsState.modalData;
  let focusedRow = productState.focusedRow;
  const storeId = userState.storeId || userState.stores[0].store;
  const storeName = '门店信息';
  const mId = memberState.memberInfo && memberState.memberInfo.data && memberState.memberInfo.data.mid;
  const itemId = focusedRow && focusedRow.product;
  const itemName = focusedRow && focusedRow.product_cName;
  const itemSKUId = focusedRow && focusedRow.productsku;
  const bCoupon = modalData.Coupon && modalData.Coupon.bHasEffectiveData ? 1 : 0;
  const bPoint = modalData.DoSaleByVipPoint && modalData.DoSaleByVipPoint.bHasEffectiveData ? 1 : 0;
  const bpromotion = productState.money.Promotion.done ? 1 : 0;

  const params = {};
  if (modalKey_Current == modalKey_Data.DoSaleByVipPoint) {
    params.mId = mId;
    params.bCoupon = bCoupon;
    params.bpromotion = bpromotion;
    params.points = 0;
    params.productsCount = productState.products && productState.products.length;
  }
  else if (modalKey_Current == modalKey_Data.Coupon) {
    params.mId = mId;
    params.storeId = storeId;
    params.bPoint = bPoint; // 是否已使用积分抵扣
    params.bpromotion = bpromotion;
    params.productsCount = productState.products && productState.products.length;
  }
  else if (modalKey_Current == modalKey_Data.HereAboutStocks) {
    params.mId = mId;
    params.storeId = storeId;
    params.storeName = storeName;
    params.itemId = itemId;
    params.itemName = itemName;
    params.pageIndex = 1;
    params.pageSize = 15;
    params.orderBy = 'distance';
    params.itemSKUId = itemSKUId;
  }
  else if (modalKey_Current == modalKey_Data.UpdateBackInfo || modalKey_Current == modalKey_Data.EditRow) {
    //   customerBusinessType returnProductType interfaceControlType
    params.customerBusinessType = 2;// 客户行业类型 1 通用业务类型  2 金一类型
    params.returnProductType = 0;// (退货方式：0非退货业务 1原单退货 2非原单退货)
    // interfaceControlType = 0;//界面控制方式 0 默认金一之前  1 非原单 回收品 按克  2 非原单 非回收品 按克  3 其他
    params.bpromotion = bpromotion;
    if (uretailHeaderState.billingStatus == status.FormerBackBill) {
      params.returnProductType = 1;
    }
    else if (uretailHeaderState.billingStatus == status.NoFormerBackBill) {
      params.returnProductType = 2;
    } else if (uretailHeaderState.billingStatus == status.OnlineBackBill) {
      /* add by jinzh1  电商退货 */
      params.returnProductType = 4;
    }
    params.mId = mId || '';
    params.storeId = storeId || '';
    // params.focusedRow = focusedRow;
    if (loopBackArray) {
      params.arraySourceType = '2'// 1 客户点击按钮或者快捷键 2 批量弹出
      params.backArray = loopBackArray;
      focusedRow = loopBackArray[0];
    }
    else if (focusedRow) {
      params.arraySourceType = '1'// 1 客户点击按钮或者快捷键 2 批量弹出
      params.backArray = new Array(focusedRow);
      // if (focusedRow.fQuantity >= 0)
      //   params.errInfo = "只能选择退货行进行编辑。"
    }
    else {
      params.arraySourceType = '0'// 出错
      params.backArray = []
      params.errInfo = '没有选中行。'
    }
    const tmp = mixRedux.getOptions().returnseasonentry;
    if (tmp && (tmp.value == 'true' || tmp.value == true))
      params.isNeedRefuseReason = true;
    else
      params.isNeedRefuseReason = false;
    params.bFixedCombo = focusedRow && focusedRow.bFixedCombo;
    params.bFixedComboHeader = params.bFixedCombo && focusedRow.title != undefined && focusedRow.title != '';
    params.bFixedComboBody = params.bFixedCombo && params.bFixedComboHeader == false;
    if (params.bFixedComboHeader)
      params.errInfo = '请修改固定套餐的子行退货信息。';
  }
  return params;
}
export function Zhoubiankucun_Restore () {
  return function (dispatch, getState) {
    const globalState = getState();
    const $state = globalState.actions.toJS();
    const stockData = $state.modalData.HereAboutStocks;
    // let selValues = stockData.selValues;
    const params = {};
    params.storeId = stockData.storeId;
    params.itemId = stockData.itemId;
    params.pageIndex = 1;
    params.pageSize = 15;
    params.orderBy = 'distance';

    const callbackList = (json) => {
      if (json.code === 200) {
        dispatch(genAction('PLATFORM_UI_BILLING_Action_Zhoubiankucun_Restore', { aroundStock: json.data }));
      }
      else if (json.code !== 200) {
        cb.utils.alert('获取周边库存失败。信息 : ' + (json.message ? json.message : JSON.stringify(json)).toString(), 'error');
        dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
      }
    }
    actionsProxy('aroundStock/aroundStock', 'POST', params, callbackList);
  }
}
// fieldName可能是自由项，也可能是 searchText ，或者pageIndex甚至以后pageSize,orderBy
export function Zhoubiankucun_ValueChange (fieldName, fieldValue, bSearch, bSelValues) {
  return function (dispatch, getState) {
    if (bSearch == true) {
      const globalState = getState();
      const $state = globalState.actions.toJS();
      const stockData = $state.modalData.HereAboutStocks;
      const selValues = stockData.selValues;
      const params = {};
      params.storeId = stockData.storeId;
      params.itemId = stockData.itemId;
      params.pageIndex = stockData.pageIndex;
      params.pageSize = stockData.pageSize;
      params.orderBy = stockData.orderBy;
      if (fieldName) {
        if (bSelValues == true)// 自定义项 搜索框
        {
          selValues[fieldName] = fieldValue;
        }
        else// 翻页
        {
          params[fieldName] = fieldValue;
        }
      }
      for (var i in selValues) {
        if (selValues.hasOwnProperty(i)) { // filter,只输出man的私有属性
          if (i.substring(0, 4) == 'free') {
            let str = '';
            if (selValues[i] && selValues[i].length > 0) {
              if (typeof (selValues[i]) == 'object') {
                selValues[i].forEach((ele) => {
                  if (str == '')
                    str = ele;
                  else
                    str = str + ',' + ele;
                });
                params[i] = str;
              }
              else {
                params[i] = selValues[i];
              }
            }
          }
          else {
            params[i] = selValues[i];
          }
        };
      }

      const callbackList = (json) => {
        if (json.code === 200) {
          dispatch(genAction('PLATFORM_UI_BILLING_Action_Zhoubiankucun_ValueChange', { bSelValues, fieldName, fieldValue, aroundStock: json.data }));
        }
        else if (json.code !== 200) {
          cb.utils.alert('获取周边库存失败。信息 : ' + (json.message ? json.message : JSON.stringify(json)).toString(), 'error');
          dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
        }
      }
      actionsProxy('aroundStock/aroundStock', 'POST', params, callbackList);
    }
    else {
      dispatch(genAction('PLATFORM_UI_BILLING_Action_Zhoubiankucun_ValueChange', { bSelValues, fieldName, fieldValue }));
    }
  }
}

function UpdateBackInfo_ShowModalCheck (modalKey_Current, dispatch, globalState, params) {
  if (params.returnProductType != 1 && params.returnProductType != 2 && params.returnProductType != 4) {
    // cb.utils.alert("当前业务不能修改退货信息！", 'error');
    dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
  }
  else if (!(params.storeId)) {
    cb.utils.alert('请录入店铺。', 'error');
    dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
  }
  else if (params.bpromotion == 1) {
    cb.utils.alert('已经执行促销，不能再修改退货信息', 'error');
    dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
  }
  else if (params.errInfo) {
    cb.utils.alert(params.errInfo, 'error');
    dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
  }
  else {
    dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_InitData', { modalKey_Current: modalKey_Current, params }));
    const callback = (json) => {
      if (json.code === 200) {
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_FillBackReason', { backReason: json.data }));
      }
      if (json.code !== 200) {
        dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
      }
    }

    let params3;
    actionsProxy('/mall/bill/ref/getReturnReasons', 'GET', params3, callback);
  }
}

function Zhoubiankucun_ShowModalCheck (modalKey_Current, dispatch, globalState, params) {
  // let $memberState = globalState.member.toJS();
  // let $state = globalState.actions.toJS();
  // let modalData = $state.modalData[modalKey_Current];
  let paramsFree = {}
  let paramsList = {};
  if (params.itemSKUId) {
    paramsFree = { itemId: params.itemId, itemSKUId: params.itemSKUId };
    paramsList = { storeId: params.storeId, itemId: params.itemId, itemSKUId: params.itemSKUId, pageIndex: params.pageIndex, pageSize: params.pageSize, orderBy: params.orderBy };
  }
  else {
    paramsFree = { itemId: params.itemId, itemSKUId: '' };
    paramsList = { storeId: params.storeId, itemId: params.itemId, itemSKUId: '', pageIndex: params.pageIndex, pageSize: params.pageSize, orderBy: params.orderBy };
  }
  let jsonFree = {};
  let jsonList = {};
  if (!(params.itemId)) {
    cb.utils.alert('请录入商品。', 'error');
    dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
  }
  else if (!(params.storeId)) {
    cb.utils.alert('请录入店铺。', 'error');
    dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
  }
  else {
    const callbackList = (json) => {
      if (json.code === 200) {
        jsonList = json;
        dispatch(genAction('PLATFORM_UI_BILLING_Action_Zhoubiankucun_InitData', { modalKey_Current: modalKey_Current, params, usedFree: jsonFree.data, aroundStock: jsonList.data }));
      }
      else if (json.code !== 200) {
        cb.utils.alert('获取周边库存失败。信息 : ' + (json.message ? json.message : JSON.stringify(json)).toString(), 'error');
        dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
      }
    }
    const callbackFree = (json) => {
      if (json.code === 200) {
        jsonFree = json;
        actionsProxy('aroundStock/aroundStock', 'POST', paramsList, callbackList);
      }
      if (json.code !== 200) {
        cb.utils.alert('获取商品规格失败。信息: ' + (json.message ? json.message : JSON.stringify(json)).toString(), 'error');
        dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
      }
    }
    // actionsProxy('aroundStock/aroundStock', 'POST', paramsList, callbackList);
    actionsProxy('aroundStock/usedFree', 'GET', paramsFree, callbackFree);
  }
}
function Youhuiquan_ShowModalCheck (modalKey_Current, dispatch, globalState, params) {
  // let $memberState = globalState.member.toJS();
  const $state = globalState.actions.toJS();
  const modalData = $state.modalData[modalKey_Current];
  const bHasUser = params.hasOwnProperty('mId') && params.mId && params.mId != '';
  if (!(params.productsCount && params.productsCount > 0)) {
    cb.utils.alert('请录入商品。', 'error');
    dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
  }
  else if (modalData.bHasEffectiveData) {
    if (cb.rest.terminalType == 3) dispatch(push('/coupon'));
    dispatch(genAction('PLATFORM_UI_BILLING_Action_LoadEditDataFromData', { modalKey_Current: modalKey_Current }));
  }
  else {
    // let { storeId, gradeId, userStores } = globalState.user.toJS();
    const data = mixRedux.getRetailVoucherData(globalState);
    const promotionMutexMap = mixRedux.getPromotionMutexMap();
    if (promotionMutexMap.iCoupon && promotionMutexMap.isAllCoupon) {
      const fPromotionSum = data.fPromotionSum;
      if (fPromotionSum && fPromotionSum > 0) {
        cb.utils.alert('已经执行了促销活动，不允许执行优惠券！', 'error');
        dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
        return
      }
    }

    /* add by jinzh1 业务参数-是否显示会员优惠券 */
    if (!cb.rest.AppContext.option.displaymembercoupon) {
      if (cb.rest.terminalType == 3) dispatch(push('/coupon'));
      dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_NoUserInit', {
        modalKey_Current: modalKey_Current, mId: params.mId, bPoint: params.bPoint, bpromotion: params.bpromotion,
        storeId: params.storeId, voucherDataBefore: data
      }));
      return;
    }

    const callback = (json) => {
      if (json.code === 200) {
        if (cb.rest.terminalType == 3) dispatch(push('/coupon'));
        if (bHasUser)
          dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_InitData', { modalKey_Current: modalKey_Current, mId: params.mId, bPoint: params.bPoint, bpromotion: params.bpromotion, storeId: params.storeId, data: json.data, voucherDataBefore: data }));// sn: params.sn,
        else
          dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_NoUserInit', { modalKey_Current: modalKey_Current, mId: params.mId, bPoint: params.bPoint, bpromotion: params.bpromotion, storeId: params.storeId, voucherDataBefore: data }));
      }
      if (json.code !== 200) {
        cb.utils.alert('获取优惠券信息失败。错误信息 = ' + (json.message ? json.message : JSON.stringify(json)).toString(), 'error');
        dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
      }
    }
    const params2 = { mid: params.mId ? params.mId : undefined, storeid: params.storeId, data: JSON.stringify(data), bpoint: params.bPoint, bpromotion: params.bpromotion };// sn: params.sn,
    // let params2 = { mid: params.mId, storeid: params.storeId }
    if (!beforeCouponService(params2)) return
    actionsProxy('thirdparty/member/querymyusecoupon', 'POST', params2, callback);
  }
}
export function Youhuiquan_changeCouponTimes (displayType, displayId, value) {
  return function (dispatch, getState) {
    const globalState = getState();
    const $state = globalState.actions.toJS();
    const $couponData = $state.modalData[$state.modalKey_Data.Coupon];
    // let voucherData = mixRedux.getRetailVoucherData(globalState);
    const voucherData = $couponData.voucherData.voucherDataBefore;
    // let couponList = $couponData.editData.CouponList;
    let curCoupon = {};
    const selectedCoupon = [];
    const inputTime = value;
    let bChoose = false;
    if (inputTime > 0)
      bChoose = true;
    $couponData.editData.CouponList.forEach((ele) => {
      if (ele.sn == displayId) {
        curCoupon = ele;
        curCoupon.select_times = inputTime;
      }
      else if (ele.displaySelected == true)
        selectedCoupon.push(ele);
    });
    const params = { bpoint: $couponData.bPoint, bpromotion: $couponData.bpromotion, data: JSON.stringify(voucherData), coupon: JSON.stringify(curCoupon), coupons: JSON.stringify(selectedCoupon) };
    const callback = (json) => {
      if (json.code === 200) {
        const data = json.data;
        if (data.flag == '0') {
          cb.utils.alert('不能选择当前优惠券。' + (data.message ? data.message : '').toString(), 'error');
          dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
        }
        else if (data.flag == '1') {
          dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_ChooseCoupon', { displayId, bChoose, data: data, inputTime }));
        }
        else if (data.flag == '2') {
          // flag  0失败 1成功  2给出提示框选择是否继续 提示优惠券金额将超出应收金额，是否继续？为是时添加，为否时不添加
          cb.utils.confirm(data.message ? data.message : '提示优惠券金额将超出应收金额，是否继续？', () => {
            dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_ChooseCoupon', { displayId, bChoose, data: data, inputTime }));
          }, () => {
            dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
          }, '点击是将选择当前优惠券，否则不选。', '是', '否');
          // confirm({
          //   title: data.message ? data.message : "提示优惠券金额将超出应收金额，是否继续？",
          //   content: '点击是将选择当前优惠券，否则不选。',
          //   okText: "是",
          //   cancelText: "否",
          //   onOk() {
          //     dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_ChooseCoupon', { displayId, bChoose, data: data, inputTime }));
          //   },
          //   onCancel() {
          //     dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
          //   },
          // });
        }
      }
      else if (json.code !== 200) {
        cb.utils.alert('选择优惠券失败。信息:' + (json.message ? json.message : JSON.stringify(json)).toString(), 'error');
        dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
      }
    }
    actionsProxy('thirdparty/member/couponcanuse', 'POST', params, callback);
  }
}
export function Youhuiquan_ChooseCoupon (displayId, bChoose) {
  return function (dispatch, getState) {
    const globalState = getState();
    const $state = globalState.actions.toJS();
    const $couponData = $state.modalData[$state.modalKey_Data.Coupon];
    if (bChoose == true) {
      // let voucherData = mixRedux.getRetailVoucherData(globalState);
      const voucherData = $couponData.voucherData.voucherDataBefore;
      // let couponList = $couponData.editData.CouponList;
      let curCoupon = {};
      const selectedCoupon = [];
      $couponData.editData.CouponList.forEach((ele) => {
        if (ele.sn == displayId) {
          curCoupon = ele;
          if (ele.displayType == 5)
            curCoupon.select_times = 1;
        }
        else if (ele.displaySelected == true)
          selectedCoupon.push(ele);
      });
      const params = { bpoint: $couponData.bPoint, bpromotion: $couponData.bpromotion, data: JSON.stringify(voucherData), coupon: JSON.stringify(curCoupon), coupons: JSON.stringify(selectedCoupon) };
      const callback = (json) => {
        if (json.code === 200) {
          const data = json.data;
          if (data.flag == '0') {
            cb.utils.alert('不能选择当前优惠券。' + (data.message ? data.message : '').toString(), 'error');
            dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
          }
          else if (data.flag == '1') {
            dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_ChooseCoupon', { displayId, bChoose, data: data }));
          }
          else if (data.flag == '2') {
            // flag  0失败 1成功  2给出提示框选择是否继续 提示优惠券金额将超出应收金额，是否继续？为是时添加，为否时不添加
            cb.utils.confirm(data.message ? data.message : '提示优惠券金额将超出应收金额，是否继续？', () => {
              dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_ChooseCoupon', { displayId, bChoose, data: data }));
            }, () => {
              dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
            }, '点击是将选择当前优惠券，否则不选。', '是', '否');
            // confirm({
            //   title: data.message ? data.message : "提示优惠券金额将超出应收金额，是否继续？",
            //   content: '点击是将选择当前优惠券，否则不选。',
            //   okText: "是",
            //   cancelText: "否",
            //   onOk() {
            //     dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_ChooseCoupon', { displayId, bChoose, data: data }));
            //   },
            //   onCancel() {
            //     dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
            //   },
            // });
          }
        }
        else if (json.code !== 200) {
          cb.utils.alert('选择优惠券失败。信息:' + (json.message ? json.message : JSON.stringify(json)).toString(), 'error');
          dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
        }
      }
      actionsProxy('thirdparty/member/couponcanuse', 'POST', params, callback);
    }
    else {
      dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_ChooseCoupon', { displayId, bChoose }));
    }
  }
}

export function Youhuiquan_ChangeCouponKey (couponKey) {
  return function (dispatch, getState) {
    dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_ChangeCouponKey', { couponKey }));
  }
}

export function Youhuiquan_InputCoupon (couponKey) {
  return function (dispatch, getState) {
    const globalState = getState();
    const $state = globalState.actions.toJS();
    const $data = $state.modalData[$state.modalKey_Data.Coupon];
    const mId = $data.mId;
    const storeId = $data.storeId;
    const couponList = $data.editData.CouponList;
    const selectedCoupon = [];
    couponList.forEach((ele) => {
      if (ele.displaySelected == true)
        selectedCoupon.push(ele);
    });
    const voucherData = $data.voucherData.voucherDataBefore;
    const params = { storeId: storeId, mId: mId, sn: couponKey, bpoint: $data.bPoint, bpromotion: $data.bpromotion, data: JSON.stringify(voucherData), coupons: JSON.stringify(selectedCoupon) };
    const callback = (json) => {
      if (json.code === 200) {
        const data = json.data;
        if (data && data.hasOwnProperty('flag')) {
          if (data.flag == '0') {
            cb.utils.alert('不能选择当前优惠券。' + (data.message ? data.message : '').toString(), 'error');
            dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
          }
          else if (data.flag == '1') {
            // dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_ChooseCoupon', { displayId, bChoose, data: data }));
            dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_InputCoupon', { storeId, mId, sn: couponKey, json }));
          }
          else if (data.flag == '2') {
            // flag  0失败 1成功  2给出提示框选择是否继续 提示优惠券金额将超出应收金额，是否继续？为是时添加，为否时不添加
            cb.utils.confirm(data.message ? data.message : '提示优惠券金额将超出应收金额，是否继续？', () => {
              dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_InputCoupon', { storeId, mId, sn: couponKey, json }));
            }, () => {
              dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
            }, '点击是将选择当前优惠券，否则不选。', '是', '否');
          }
        }
        else {
          dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_InputCoupon', { storeId, mId, sn: couponKey, json }));
        }
      }
      if (json.code !== 200) {
        dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_InputCouponError'));
        if (cb.rest.terminalType == 3)
          cb.utils.alert('无此优惠券~', 'error');
      }
    }
    actionsProxy('thirdparty/member/querymycoupon', 'POST', params, callback);
  }
}

function Jifendikou_ShowModalCheck (modalKey_Current, dispatch, globalState, params) {
  const $state = globalState.actions.toJS();
  const modalData = $state.modalData[modalKey_Current];
  const data = mixRedux.getRetailVoucherData(globalState);
  if (!(params.mId && params.productsCount && params.productsCount > 0)) {
    cb.utils.alert('请登录会员并录入商品。', 'error');
    dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
  }

  else if (modalData.bHasEffectiveData) {
    // actionsRedux.Jifendikou_LoadEditDataFromData();
    dispatch(genAction('PLATFORM_UI_BILLING_Action_LoadEditDataFromData', { modalKey_Current }));
  }
  else {
    const promotionMutexMap = mixRedux.getPromotionMutexMap();
    if (promotionMutexMap.iIntegral) {
      const fPromotionSum = data.fPromotionSum;
      if (fPromotionSum && fPromotionSum > 0) {
        cb.utils.alert('已经执行了促销活动，不允许执行积分抵扣！', 'error');
        dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
        return
      }
    }
    const callback = (json) => {
      if (json.code === 200) {
        if (isNaN(json.data.memberpoints) == false && json.data.memberpoints > 0 && json.data.points <= 0) {
          if (json.data.points == 0) {
            cb.utils.alert('当前商品不参与抵扣操作。', 'error');
          } else {
            cb.utils.alert('退货商品的积分已经大于等于新购买商品的积分，不必再进行积分抵扣操作。', 'error');
          }
          dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
        }
        // else if (isNaN(json.data.memberpoints) == false && json.data.memberpoints > 0 && json.data.points <= 0) {
        //   cb.utils.alert("没有可以执行积分抵扣的商品行22222。", 'error');
        //   dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
        // }
        else if (isNaN(json.data.memberpoints) == false && json.data.memberpoints < 0 && json.data.points <= 0) {
          cb.utils.alert('该会员没有积分。', 'error');
          dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
        }
        else {
          dispatch(genAction('PLATFORM_UI_BILLING_Action_Jifendikou_InitData', { modalKey_Current: modalKey_Current, bCoupon: params.bCoupon, bpromotion: params.bpromotion, data: json.data, voucherDataBefore: data, voucherDataAfter: json.data.data }));
        }
      }
      if (json.code !== 200) {
        cb.utils.alert('获取积分信息失败。信息:' + (json.message ? json.message : JSON.stringify(json)).toString(), 'error');
        dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
      }
    }
    const params2 = { bcoupon: params.bCoupon, bpromotion: params.bpromotion, points: params.points, data: JSON.stringify(data) };
    actionsProxy('thirdparty/member/pointuse', 'POST', params2, callback);
  }
}

function EditRow_ShowModalCheck (modalKey_Current, dispatch, globalState, params) {
  const currentFunc = PreferentialFunc[modalKey_Current];
  const focusedRow = globalState.product.toJS().focusedRow;
  if (!focusedRow) {
    cb.utils.alert('请先录入商品！', 'error')
    return;
  }
  mixRedux.canExecute(globalState, currentFunc.key, function () {
    currentFunc.canOpen(dispatch, globalState, function () {
      UpdateBackInfo_ShowModalCheck(modalKey_Current, dispatch, globalState, params);
      dispatch(genAction('PLATFORM_UI_BILLING_Action_ShowModal', { modalKey_Current }));
    });
  });
}
function buildMatchProduct (modalKey_Current, dispatch, globalState, params) {
  let focusedRow = globalState.product.get('focusedRow');
  focusedRow = Immutable.Map.isMap(focusedRow) ? focusedRow.toJS() : focusedRow;
  if (cb.utils.isEmpty(focusedRow)) {
    cb.utils.alert('未录入商品，不允许进行选配!', 'error');
    return
  }
  /* add  by 金子涵 商品是否支持选配 */
  const bMatching = focusedRow['product_productProps!define4'];
  if (bMatching == '无选配' || cb.utils.isEmpty(bMatching)) {
    cb.utils.alert('该商品不支持选配!', 'error');
    return
  }
  const modalData = globalState.actions.get('modalData').toJS();
  if (modalData.MatchProduct.vm && modalData.MatchProduct.viewmeta) {
    var newParams = modalData.MatchProduct.vm.getParams();
    newParams.rowData = focusedRow;
    newParams.saveCallBack = function (data) {
      matchProductSave(data, dispatch, globalState);
    }
    modalData.MatchProduct.vm.initData();
    dispatch(genAction('PLATFORM_UI_BILLING_Action_ShowModal', { modalKey_Current }));
    return
  }
  const args = {
    mode: 'add', rowData: focusedRow, saveCallBack: function (data) {
      matchProductSave(data, dispatch, globalState);
    }
  };
  cb.loader.runCommandLine('bill', { billtype: 'voucher', billno: 'aa_productoptional', params: args },
    null, (vm, viewmeta) => {
      modalData.MatchProduct.vm = vm;
      modalData.MatchProduct.viewmeta = viewmeta;
      dispatch(genAction('PLATFORM_UI_BILLING_MERGER_MODALDATA', modalData))
      dispatch(genAction('PLATFORM_UI_BILLING_Action_ShowModal', { modalKey_Current }));
    });
}
function matchProductSave (data, dispatch, globalState) {
  let focusedRow = globalState.product.get('focusedRow');
  focusedRow = Immutable.Map.isMap(focusedRow) ? focusedRow.toJS() : focusedRow;
  focusedRow.retailVouchMatchings = data;
  dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', focusedRow));
  dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
}
// 隐藏模态框
export function handleCancel (modalKey_Current) {
  return function (dispatch) {
    if (!beforeHandleCancel(modalKey_Current)) return;
    dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
  }
}
export function handleOk (modalKey_Current) {
  return async function (dispatch, getState) {
    const resultData = await beforeHandleOk(modalKey_Current);
    if (!resultData) return;
    if (modalKey_Current === 'DoSaleByVipPoint')
      HandleOk_Jifendikou(dispatch, getState);
    else if (modalKey_Current === 'Coupon')
      HandleOk_Youhuiquan(dispatch, getState);
    else if (modalKey_Current === 'HereAboutStocks')
      HandleOk_Zhoubiankucun(dispatch, getState);
    // else if (modalKey_Current == "UpdateBackInfo")
    //   HandleOk_UpdateBackInfo(dispatch, getState);

    /* add by jinzh1 商品选配确认 */
    else if (modalKey_Current === 'MatchProduct') {
      const viewModel = getState().actions.toJS().modalData.MatchProduct.vm;
      const beforeSave = (beforeActData, callback) => {
        beforeActData.close = function () {
          // dynamicModalActions.closeModal(); // 因为未找到dynamicModalActions的定义，所以将此行注释掉
        };
        viewModel.promiseExecute('beforeSave', beforeActData, callback);
      };
      viewModel.biz.action().save(viewModel.getParams().billNo, viewModel, null, beforeSave, null);
    }
    else {
      if (modalKey_Current == 'UpdateBackInfo')
        modalKey_Current = 'EditRow'
      const currentFunc = PreferentialFunc[modalKey_Current];
      if (!currentFunc) {
        cb.utils.alert('正在开发中，敬请期待')
        return;
      }
      dispatch(currentFunc.exec());
    }
  }
}
// function HandleOk_UpdateBackInfo(dispatch, getState) {
//   let globalState = getState();
//   let $state = globalState.actions.toJS();
//   let params = $state.modalData[$state.modalKey_Data.UpdateBackInfo].params;
//   if (UpdateBackInfo_SaveValidate(params)) {
//     // dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
//     UpdateBackInfo_execUpdate(dispatch, params, $state.modalData.UpdateBackInfo.backReason, globalState);
//   }
//   else {
//     dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_SetCheckParams', { params }));
//   }
// }
export function execUpdateBackInfo (callback) {
  return function (dispatch, getState) {
    const globalState = getState();
    const $state = globalState.actions.toJS();
    const params = $state.modalData[$state.modalKey_Data.UpdateBackInfo].params;
    if (UpdateBackInfo_SaveValidate(params)) {
      UpdateBackInfo_execUpdate(dispatch, params, $state.modalData.UpdateBackInfo.backReason, globalState, callback);
    } else {
      callback(false);
      dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_SetCheckParams', { params }));
    }
  }
}
function HandleOk_Zhoubiankucun (dispatch, getState) {
  dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
}
function HandleOk_Youhuiquan (dispatch, getState) {
  const globalState = getState();
  const $state = globalState.actions.toJS();
  const $couponData = $state.modalData[$state.modalKey_Data.Coupon];
  // let voucherData = mixRedux.getRetailVoucherData(globalState);
  const couponList = $couponData.editData.CouponList;
  const selectedCoupon = [];
  couponList.forEach((ele) => {
    if (ele.displaySelected == true)
      selectedCoupon.push(ele);
  });
  if (selectedCoupon.length > 0) {
    const voucherData = $couponData.voucherData.voucherDataBefore;

    const params = { data: JSON.stringify(voucherData), coupons: JSON.stringify(selectedCoupon) };
    const callback = (json) => {
      if (json.code === 200) {
        if (cb.rest.terminalType == 3) dispatch(goBack());
        $couponData.voucherData.voucherDataAfter = json.data;
        $couponData.bHasEffectiveData = true;
        $couponData.bHasEditData = false;
        $couponData.couponKey = ''
        $couponData.editData.inputErrInfoDisplay = '';
        common_CopyData($couponData.editData, $couponData.data, $state);
        common_NotifyMainPage(dispatch, $state, json.data, $couponData);
        dispatch(genAction('PLATFORM_UI_BILLING_Action_Youhuiquan_HandleOk', $couponData));
      }
      else if (json.code !== 200) {
        cb.utils.alert('分摊优惠券失败。信息:' + (json.message ? json.message : JSON.stringify(json)).toString(), 'error');
        dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
      }
    }
    actionsProxy('thirdparty/member/coupondivide', 'POST', params, callback);
  } else {
    if ($couponData.bHasEffectiveData) {
      cancelBusiness(dispatch, $state);
    } else {
      dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
    }
    if (cb.rest.terminalType == 3) dispatch(goBack());
  }
}

function cancelBusiness (dispatch, $state, data) {
  const modalKey_Current = $state.modalKey_Current;
  let key = '';
  const oldData = data || $state.modalData[modalKey_Current].voucherData.voucherDataBefore;
  if (modalKey_Current == $state.modalKey_Data.Coupon)
    key = 'Coupon';
  else if (modalKey_Current == $state.modalKey_Data.DoSaleByVipPoint)
    key = 'Point';
  if (key && oldData) {
    mixRedux.canCancel(key, function () {
      dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS', { key: key, value: oldData }));
      dispatch(genAction('PLATFORM_UI_BILLING_Action_clearRedux', { modalKey_Current, bCancel: true }));
    });
  }
  else {
    cb.utils.alert('向主界面发送数据参数不正确。', 'error')
  }
}
/* 取消积分抵扣／优惠券（主体为cancelBusiness） */
export function cancelExecute (oldData, key) {
  return function (dispatch, getState) {
    // let $state = getState().actions.toJS();
    const modalKey_Current = key === 'Point' ? 'DoSaleByVipPoint' : 'Coupon';
    if (key && oldData) {
      mixRedux.canCancel(key, function () {
        dispatch(genAction('PLATFORM_UI_BILLING_CANCEL_PREFERENTIAL_UPDATE_PRODUCTS', { key: key, value: oldData }));
        dispatch(genAction('PLATFORM_UI_BILLING_Action_clearRedux', { modalKey_Current, bCancel: true }));
      });
    }
  }
}

function HandleOk_Jifendikou (dispatch, getState) {
  const globalState = getState();
  const $state = globalState.actions.toJS();
  const point = $state.modalData.DoSaleByVipPoint;
  if ((point.editData.points < 0) || (point.editData.points > 0 && point.editData.minpoints && point.editData.points < point.editData.minpoints)) {
    cb.utils.alert('使用积分必须大于等于' + (point.editData.minpoints ? point.editData.minpoints : '零').toString() + '。', 'error');
    dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
  }

  else if (Math.floor(point.editData.points) != point.editData.points) {
    cb.utils.alert('使用积分必须为整数。', 'error');
    dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
  }
  else if (point.editData.points == point.editData.pointscanuse && (point.data.points == 0 || point.data.points == point.editData.pointscanuse)) {
    // common_NotifyMainPage(dispatch, $state);
    // dispatch(genAction('PLATFORM_UI_BILLING_Action_Jifendikou_HandleOk', { data: point.editData, voucherDataAfter: point.voucherData.voucherDataAfter }));
    HandleOk_Jifendikou_2(dispatch, $state);
  }
  else if (point.editData.points == 0) {
    if (point.bHasEffectiveData) {
      // common_NotifyMainPage(dispatch, $state, point.voucherData.voucherDataBefore);
      // dispatch(genAction('PLATFORM_UI_BILLING_Action_clearRedux', { modalKey_Current: "DoSaleByVipPoint", bCancel: true }));
      cancelBusiness(dispatch, $state);
    }
    else {
      dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
    }
  }
  else {
    const data = point.voucherData.voucherDataBefore;
    const params = { bcoupon: point.bCoupon, bpromotion: point.bpromotion, points: point.editData.points, money: point.editData.moneyuse, data: JSON.stringify(data) };
    const callback = (json) => {
      if (json.code === 200) {
        // let jsonData = json.data;
        // common_NotifyMainPage(dispatch, $state, jsonData.data);
        // dispatch(genAction('PLATFORM_UI_BILLING_Action_Jifendikou_HandleOk', { data: jsonData, voucherDataAfter: jsonData.data }));
        HandleOk_Jifendikou_2(dispatch, $state, json.data);
      }
      else if (json.code !== 200) {
        cb.utils.alert('分配积分信息失败。错误信息 = ' + JSON.stringify(json), 'error');
        dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
      }
    }
    actionsProxy('thirdparty/member/pointuse', 'POST', params, callback);
  }
}

export function HandleOk_Jifendikou_2 (dispatch, $state, jsonData) {
  // common_NotifyMainPage(dispatch, $state);
  // dispatch(genAction('PLATFORM_UI_BILLING_Action_Jifendikou_HandleOk', { data: point.editData, voucherDataAfter: point.voucherData.voucherDataAfter }));

  // common_NotifyMainPage(dispatch, $state, jsonData.data);
  // dispatch(genAction('PLATFORM_UI_BILLING_Action_Jifendikou_HandleOk', { data: jsonData, voucherDataAfter: jsonData.data }));
  const point = $state.modalData.DoSaleByVipPoint;
  const data = jsonData || point.editData;
  const voucherData = jsonData ? jsonData.data : point.voucherData.voucherDataAfter;
  common_CopyData(data, point.data, $state);
  point.data.pointscanuse = point.editData.pointscanuse;
  point.voucherData.voucherDataAfter = voucherData;
  $state.modalData.DoSaleByVipPoint.bHasEffectiveData = true;
  $state.modalData.DoSaleByVipPoint.bHasEditData = false;
  common_NotifyMainPage(dispatch, $state, voucherData, point);
  dispatch(genAction('PLATFORM_UI_BILLING_Action_Jifendikou_HandleOk', point));
}

export function actionsProxy (url, method, params, callback) {
  const config = { url: url, method: method, params: params };
  proxy(config)
    .then(json => {
      callback(json);
    });
}

export function Jifendikou_PointChange (value) {
  return function (dispatch) {
    dispatch(genAction('PLATFORM_UI_BILLING_Action_Jifendikou_PointChange', { value }));
  }
}
export function loadData (data) {
  return function (dispatch) {
    const actionData = [];
    data.forEach(item => {
      const { command, name, hotKey } = item;
      // if (command === 'InputEmployee') return;
      // actionData.push({ key: command, title: `${name}(${hotKey})`, titleName: name, hotKey: hotKey });
      actionData.push({ key: command, title: name, hotKey: hotKey });
    });
    dispatch(genAction('PLATFORM_UI_BILLING_LOAD_BOTTOM_ACTION', actionData));
    dispatch(genAction('PLATFORM_UI_BILLING_LOAD_ACTION_AUTH', data));/* 开单权限 */
  }
}
function UpdateBackInfo_CheckInputRange (interfaceControlType, params, fieldName, fieldValue) {
  const result = {};
  result.errInfo = '';
  result.fieldValue = fieldValue;
  return result;
  // if (isNaN(fieldValue) == false) {
  //   if (fieldName == "goldPrice") {
  //     if (Number(fieldValue) < 0)
  //       result.fieldValue = 0;
  //   }
  //   else if (fieldName == "goldWeight") {
  //     if (Number(fieldValue) < 0)
  //       result.fieldValue = 1;
  //   }
  //   else if (fieldName == "goldRecycleLossRate") {
  //     if (Number(fieldValue) < 0)
  //       result.fieldValue = 0;
  //     else if (Number(fieldValue) >= 100) {
  //       result.fieldValue = params.goldRecycleLossRate;
  //       result.errInfo = "回收损耗率大于等于零小于100.";
  //     }
  //   }
  //   else if (fieldName == "goldRecycleFee") {
  //     if (Number(fieldValue) < 0)
  //       result.fieldValue = 0;
  //   }
  //   else if (fieldName == "goldFeeDiscountRate") {
  //     if (Number(fieldValue) < 0)
  //       result.fieldValue = 0;
  //     else if (Number(fieldValue) >= 100) {
  //       result.fieldValue = params.goldRecycleLossRate;
  //       result.errInfo = "折扣率请输入大于等于零小于100的数字.";
  //     }
  //   }
  //   else if (fieldName == "fQuotePrice") {
  //     if (Number(fieldValue) < 0)
  //       result.fieldValue = 0;
  //   }
  //   else if (fieldName == "fPrice") {
  //     if (Number(fieldValue) < 0)
  //       result.fieldValue = 0;
  //   }
  //   else if (fieldName == "fQuantity") {
  //     if (Number(fieldValue) > 0)
  //       result.fieldValue = 0 - fieldValue;
  //   }
  //   else if (fieldName == "fMoney") {
  //     if (Number(fieldValue) > 0)
  //       result.fieldValue = 0 - fieldValue;
  //   }
  //   else if (fieldName == "goldReturnMoney") {
  //     if (Number(fieldValue) > 0)
  //       result.fieldValue = 0 - fieldValue;
  //   }
  //   else if (fieldName == "goldSaleFee") {
  //     if (Number(fieldValue) < 0)
  //       result.fieldValue = 0;
  //   }
  //   else if (fieldName == "goldFeeDiscountMoney") {
  //     if (Number(fieldValue) > 0)
  //       result.fieldValue = 0 - fieldValue;
  //   }
  // }
  // return result;
}
function UpdateBackInfo_CheckInputIsNum (fieldName, fieldValue) {
  const numArray = [];
  numArray.push('goldWeight')
  numArray.push('goldPrice')
  numArray.push('goldRecycleLossRate')
  numArray.push('goldFeeDiscountRate')
  numArray.push('goldRecycleFee')

  numArray.push('fQuotePrice');
  numArray.push('fPrice');
  numArray.push('fQuantity');
  numArray.push('fMoney');
  numArray.push('goldReturnMoney')
  numArray.push('goldSaleFeeCalcType')
  numArray.push('goldSaleFee')
  numArray.push('goldFeeDiscountMoney')
  if (numArray.indexOf(fieldName) >= 0) {
    if (isNaN(fieldValue) && fieldValue != '-') {
      console.log('录入的不是数字 fieldName = ' + fieldName + '  fieldValue = ' + fieldValue);
      return false;
    }
    if (fieldValue.toString() != fieldValue.toString().replace(' ', '')) {
      console.log('录入的不是数字 fieldName = ' + fieldName + '  fieldValue = ' + fieldValue);
      return false;
    }
  }
  return true;
}
// function calculate_ToNumber(value, numPoint) {
//   if (isNaN(value) || value == "") {
//     return Number(0).toFixed(numPoint);
//   }
//   else {
//     return Number(value).toFixed(numPoint);
//   }
// }
function calculate_Add (value1, value2, numPoint) {
  let result;
  if (numPoint === undefined)
    numPoint = 10;
  if (isNaN(value1) || value1 === '') {
    return calculate_Add(0, value2, numPoint);
  }
  else if (isNaN(value2) || value2 === '') {
    return calculate_Add(value1, 0, numPoint);
  }
  else {
    result = (Number(value1) + Number(value2)).toFixed(numPoint);
  }
  return result;
}

function calculate_Subtract (value1, value2, numPoint) {
  let result;
  if (numPoint === undefined)
    numPoint = 10;
  if (isNaN(value1) || value1 === '') {
    return calculate_Subtract(0, value2, numPoint);
  }
  else if (isNaN(value2) || value2 === '') {
    return calculate_Subtract(value1, 0, numPoint);
  }
  else {
    result = (Number(value1) - Number(value2)).toFixed(numPoint);
  }
  return result;
}

function calculate_Multiply (value1, value2, numPoint) {
  let result;
  if (numPoint === undefined)
    numPoint = 10;
  if (isNaN(value1) || value1 === '') {
    result = Number(0).toFixed(numPoint);
  }
  else if (isNaN(value2) || value2 === '') {
    result = Number(0).toFixed(numPoint);
  }
  else {
    result = (Number(value1) * Number(value2)).toFixed(numPoint);
  }
  return result;
}

function calculate_Divide (value1, value2, numPoint) {
  let result;
  if (numPoint === undefined)
    numPoint = 10;
  if (isNaN(value1) || isNaN(value2) || value1 == '' || value2 == '' || Number(value2) == 0) {
    result = undefined;
  }
  else {
    result = (Number(value1) / Number(value2)).toFixed(numPoint);
  }
  return result;
}

function calculate_ConvertToCalcValue (fieldValue, nullValue) {
  if (isNaN(fieldValue) || fieldValue === '') {
    return nullValue;
  }
  else {
    return Number(fieldValue);
  }
}

// 校验合法性
function UpdateBackInfo_SaveValidate (params) {
  const returnProductType = params.returnProductType;// (1原单2非原单)
  const fQuantity = params.fQuantity;
  const fCanCoQuantity = params.fCanCoQuantity;
  const fQuotePrice = params.fQuotePrice;
  // let fPrice = params.fPrice;
  const isNeedRefuseReason = params.isNeedRefuseReason;
  const iBackid = params.iBackid;
  const saleDate = params.saleDate;
  const goldPrice = params.goldPrice;
  const goldWeight = params.goldWeight;
  const fMoney = params.fMoney;
  params.fQuantity_bOk = true;
  params.fQuotePrice_bOk = true;
  params.goldPrice_bOk = true;
  params.goldWeight_bOk = true;
  params.fMoney_bOk = true;
  params.fPrice_bOk = true;
  params.refuseReason_bOk = true;
  params.saleDate_bOk = true;

  let errMsg = ''; let isErr = false;

  if (isNaN(fQuantity) || fQuantity === '' || Number(fQuantity) >= 0) {
    params.fQuantity_bOk = false;
    params.fQuantity_Err = '数量字段请录入小于零的数字。';
    if (cb.rest.terminalType == 3) {
      errMsg = '数量字段请录入小于零的数字。';
      isErr = true;
    }
  }
  else if (returnProductType == '1' && (Math.abs(Number(fQuantity)) > Math.abs(Number(fCanCoQuantity)))) {
    params.fQuantity_bOk = false;
    params.fQuantity_Err = '退货数量不能大于原单未退货数量。';
    if (!isErr && cb.rest.terminalType == 3) {
      errMsg = '退货数量不能大于原单未退货数量。';
      isErr = true;
    }
  }

  if (isNaN(fQuotePrice) || fQuotePrice === '') {
    params.fQuotePrice_bOk = false;
    params.fQuotePrice_Err = '零售价字段请录入数字。';
    if (!isErr && cb.rest.terminalType == 3) {
      errMsg = '零售价字段请录入数字。';
      isErr = true;
    }
  }
  if (params.interfaceControlType == 1 || params.interfaceControlType == 2) {
    if (isNaN(goldPrice) || goldPrice === '') {
      params.goldPrice_bOk = false;
      params.goldPrice_Err = '金价不合法。';
      if (!isErr && cb.rest.terminalType == 3) {
        errMsg = '金价不合法。';
        isErr = true;
      }
    }
  }
  if (params.interfaceControlType == 3 || params.returnProductType == 2) {
    if (isNaN(fMoney) || fMoney === '' || Number(fMoney) > 0) {
      params.fMoney_bOk = false;
      params.fMoney_Err = '实退金额必须小于等于零。';
      if (!isErr && cb.rest.terminalType == 3) {
        errMsg = '实退金额必须小于等于零。';
        isErr = true;
      }
    }
  }

  let disabled_goldWeight = !(params.returnProductType == '2' && params.goldIsRecyclePruduct == true);
  if (params.interfaceControlType == 2)
    disabled_goldWeight = true;
  if (params.bFixedComboHeader)
    disabled_goldWeight = true;
  if (disabled_goldWeight == false && (goldWeight == undefined || goldWeight.toString() == '' || Number(goldWeight) == 0)) {
    params.goldWeight_bOk = false;
    params.goldWeight_Err = '重量不可为空或者零。';
    if (!isErr && cb.rest.terminalType == 3) {
      errMsg = '重量不可为空或者零。';
      isErr = true;
    }
  }

  if (isNeedRefuseReason == true && params.bFixedComboHeader == false && (iBackid == undefined || iBackid.toString() == '' || iBackid.toString() == '0')) {
    params.refuseReason_bOk = false;
    params.refuseReason_Err = '退货原因不可为空。';
    if (!isErr && cb.rest.terminalType == 3) {
      errMsg = '退货原因不可为空。';
      isErr = true;
    }
  }
  if (returnProductType == '2' && saleDate) {
    var myDate = new Date(saleDate);
    var nowDate = new Date();
    if (myDate > nowDate) {
      params.saleDate_bOk = false;
      params.saleDate_Err = '销售日期不可大于当前日期。';
      if (!isErr && cb.rest.terminalType == 3) {
        errMsg = '销售日期不可大于当前日期。';
        isErr = true;
      }
    }
  }
  params.bOk = params.fMoney_bOk && params.fQuantity_bOk && params.fQuotePrice_bOk && params.goldWeight_bOk && params.goldPrice_bOk && params.fPrice_bOk && params.refuseReason_bOk && params.saleDate_bOk;
  if (!params.bOk && cb.rest.terminalType == 3) {
    cb.utils.alert(errMsg, 'error');
  }
  return params.bOk;
}
export function UpdateBackInfo_Params (obj) {
  return function (dispatch, getState) {
    dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_UpdateParams', obj));
  }
}
export function UpdateBackInfo_ValueChange (fieldName, fieldValue) {
  return function (dispatch, getState) {
    const globalState = getState();
    const $state = globalState.actions.toJS();
    const params = $state.modalData.UpdateBackInfo.params;
    const changeValues = [];
    let value = '';
    // let fieldValue2 = 0;
    const numPoint_Price = calculate_ConvertToCalcValue(mixRedux.getOptions().monovalentdecimal.value, 2);
    const numPoint_Money = calculate_ConvertToCalcValue(mixRedux.getOptions().amountofdecimal.value, 2);
    const numPoint_Quantity = calculate_ConvertToCalcValue(mixRedux.getOptions().numPoint_Quantity.value, 2);
    // let numPoint_Weight = calculate_ConvertToCalcValue(mixRedux.getOptions().numPoint_Weight.value, 2);
    const numPoint_Rate = calculate_ConvertToCalcValue(mixRedux.getOptions().numPoint_Rate.value, 2);

    console.log('mixRedux.getOptions().monovalentdecimal.value = ' + mixRedux.getOptions().monovalentdecimal.value);
    console.log('mixRedux.getOptions().amountofdecimal.value = ' + mixRedux.getOptions().amountofdecimal.value);
    fieldValue = fieldValue.target ? fieldValue.target.value : fieldValue;
    if (UpdateBackInfo_CheckInputIsNum(fieldName, fieldValue) == false) {
      dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
      return;
    }
    const result = UpdateBackInfo_CheckInputRange(params.interfaceControlType, params, fieldName, fieldValue);
    if (result.errInfo) {
      dispatch(genAction('PLATFORM_UI_BILLING_Action_ReturnNothing'));
      cb.utils.alert(result.errInfo, 'error')
      return;
    }
    else {
      fieldValue = result.fieldValue;
    }
    // fieldValue = Number(fieldValue);
    if (params.interfaceControlType == 0) {
      if (fieldName == 'fQuotePrice') {
        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
      else if (fieldName == 'fPrice') {
        value = calculate_Multiply(fieldValue, params.fQuantity, numPoint_Money)
        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        changeValues.push({ fieldName: 'fMoney', fieldValue: value });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
      else if (fieldName == 'fQuantity') {
        if (!isNaN(fieldValue) && fieldValue != '') {
          if (Number(fieldValue) > 0)
            fieldValue = 0 - Number(fieldValue);
        }
        value = calculate_Multiply(fieldValue, params.fPrice, numPoint_Money)
        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        changeValues.push({ fieldName: 'fMoney', fieldValue: value });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
      else if (fieldName == 'fMoney') {
        if (!isNaN(fieldValue) && fieldValue != '') {
          if (Number(fieldValue) > 0)
            fieldValue = 0 - Number(fieldValue);
        }
        value = calculate_Divide(fieldValue, params.fQuantity, numPoint_Price)
        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        changeValues.push({ fieldName: 'fPrice', fieldValue: value });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
      else {
        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
    }
    let goldFeeDiscountRate = fieldName == 'goldFeeDiscountRate' ? fieldValue : params.goldFeeDiscountRate;
    goldFeeDiscountRate = calculate_ConvertToCalcValue(goldFeeDiscountRate, 100);
    let goldWeight = fieldName == 'goldWeight' ? fieldValue : params.goldWeight;
    goldWeight = calculate_ConvertToCalcValue(goldWeight, 0);
    let goldPrice = fieldName == 'goldPrice' ? fieldValue : params.goldPrice;
    goldPrice = calculate_ConvertToCalcValue(goldPrice, 0);
    let goldRecycleFee = fieldName == 'goldRecycleFee' ? fieldValue : params.goldRecycleFee;
    goldRecycleFee = calculate_ConvertToCalcValue(goldRecycleFee, 0);
    let goldSaleFee = fieldName == 'goldSaleFee' ? fieldValue : params.goldSaleFee;
    goldSaleFee = calculate_ConvertToCalcValue(goldSaleFee, 0);
    let fQuotePrice = fieldName == 'fQuotePrice' ? fieldValue : params.fQuotePrice;
    fQuotePrice = calculate_ConvertToCalcValue(fQuotePrice, 0);
    let fQuantity = fieldName == 'fQuantity' ? fieldValue : params.fQuantity;
    fQuantity = calculate_ConvertToCalcValue(fQuantity, 0);
    let fMoney = fieldName == 'fMoney' ? fieldValue : params.fMoney;
    fMoney = calculate_ConvertToCalcValue(fMoney, 0);
    let goldRecycleLossRate = fieldName == 'goldRecycleLossRate' ? fieldValue : params.goldRecycleLossRate;
    goldRecycleLossRate = calculate_ConvertToCalcValue(goldRecycleLossRate, 0);
    let goldFeeDiscountMoney = fieldName == 'goldFeeDiscountMoney' ? fieldValue : params.goldFeeDiscountMoney;
    goldFeeDiscountMoney = calculate_ConvertToCalcValue(goldFeeDiscountMoney, 0);
    let goldReturnMoney = fieldName == 'goldReturnMoney' ? fieldValue : params.goldReturnMoney;
    goldReturnMoney = calculate_ConvertToCalcValue(goldReturnMoney, 0);
    let fPrice = fieldName == 'fPrice' ? fieldValue : params.fPrice;
    fPrice = calculate_ConvertToCalcValue(fPrice, 0);
    let foldPrice = fieldName == 'foldPrice' ? fieldValue : params.foldPrice;
    foldPrice = calculate_ConvertToCalcValue(foldPrice, 0);
    if (params.interfaceControlType == 1) {
      if (fieldName == 'goldWeight' || fieldName == 'goldPrice' || fieldName == 'goldRecycleLossRate' || fieldName == 'goldRecycleFee') {
        // 重量×(1－回收损耗率)×金价－重量×(1－回收损耗率)×回收工费
        const value1 = calculate_Multiply(calculate_Multiply(goldWeight, goldPrice), calculate_Subtract(1, goldRecycleLossRate / 100), numPoint_Price)
        const value2 = calculate_Multiply(calculate_Multiply(goldWeight, goldRecycleFee), calculate_Subtract(1, goldRecycleLossRate / 100), numPoint_Price)
        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        changeValues.push({ fieldName: 'fPrice', fieldValue: calculate_Subtract(value1, value2, numPoint_Price) });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
      else {
        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
    }
    else if (params.interfaceControlType == 2) {
      //  (params.goldSaleFeeCalcType == "按克")
      if (fieldName == 'goldWeight' || fieldName == 'goldPrice' || fieldName == 'goldSaleFee') {
        let fQuotePrice = 0;
        if (params.goldSaleFeeCalcType == '按克')
          fQuotePrice = calculate_Multiply(goldWeight, calculate_Add(goldPrice, goldSaleFee), numPoint_Price);// 重量×（金价＋销售工费）
        else
          fQuotePrice = calculate_Add(calculate_Multiply(goldWeight, goldPrice), goldSaleFee, numPoint_Price);// 重量×金价＋销售工费”

        fPrice = calculate_Multiply(fQuotePrice, goldFeeDiscountRate / 100, numPoint_Price);
        goldReturnMoney = calculate_Multiply(fPrice, fQuantity, numPoint_Money);
        goldFeeDiscountMoney = calculate_Multiply(fQuantity, calculate_Subtract(fQuotePrice, fPrice, numPoint_Price), numPoint_Money);
        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        changeValues.push({ fieldName: 'fQuotePrice', fieldValue: fQuotePrice });
        changeValues.push({ fieldName: 'fPrice', fieldValue: fPrice });
        changeValues.push({ fieldName: 'goldReturnMoney', fieldValue: goldReturnMoney });
        changeValues.push({ fieldName: 'goldFeeDiscountMoney', fieldValue: goldFeeDiscountMoney });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
      else if (fieldName == 'goldFeeDiscountRate') {
        fPrice = calculate_Multiply(fQuotePrice, goldFeeDiscountRate / 100, numPoint_Price);
        goldReturnMoney = calculate_Multiply(fPrice, fQuantity, numPoint_Money);
        goldFeeDiscountMoney = calculate_Multiply(fQuantity, calculate_Subtract(fQuotePrice, fPrice, numPoint_Price), numPoint_Money);
        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        changeValues.push({ fieldName: 'fPrice', fieldValue: fPrice });
        changeValues.push({ fieldName: 'goldReturnMoney', fieldValue: goldReturnMoney });
        changeValues.push({ fieldName: 'goldFeeDiscountMoney', fieldValue: goldFeeDiscountMoney });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
      else if (fieldName == 'goldFeeDiscountMoney') {
        // let goldFeeDiscountRate = calculate_Subtract(1, calculate_Divide(fieldValue, params.fQuotePrice, 4), 4) * 100;
        //  折扣额：默认0，可改，需小于等于零，改后更新实退价＝零售价－折扣额÷表体数量，折扣率%＝实退价÷零售价×100
        fPrice = calculate_Subtract(fQuotePrice, calculate_Divide(goldFeeDiscountMoney, fQuantity), numPoint_Price);
        goldReturnMoney = calculate_Multiply(fPrice, fQuantity, numPoint_Money);
        goldFeeDiscountRate = calculate_Multiply(calculate_Divide(fPrice, fQuotePrice), 100, numPoint_Rate);
        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        changeValues.push({ fieldName: 'fPrice', fieldValue: fPrice });
        changeValues.push({ fieldName: 'goldReturnMoney', fieldValue: goldReturnMoney });
        changeValues.push({ fieldName: 'goldFeeDiscountRate', fieldValue: goldFeeDiscountRate });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
      else if (fieldName == 'goldReturnMoney') {
        // 折扣率%＝实退金额÷（零售价×表体数量）×100、折扣额＝表体数量×零售价－实退金额
        fPrice = calculate_Divide(goldReturnMoney, fQuantity, numPoint_Price);
        goldFeeDiscountRate = calculate_Multiply(calculate_Divide(goldReturnMoney, calculate_Multiply(fQuotePrice, fQuantity)), 100, numPoint_Rate);
        goldFeeDiscountMoney = calculate_Subtract(calculate_Multiply(fQuotePrice, fQuantity), goldReturnMoney, numPoint_Money);
        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        changeValues.push({ fieldName: 'fPrice', fieldValue: fPrice });
        changeValues.push({ fieldName: 'goldFeeDiscountRate', fieldValue: goldFeeDiscountRate });
        changeValues.push({ fieldName: 'goldFeeDiscountMoney', fieldValue: goldFeeDiscountMoney });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
      else {
        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
    }
    else if (params.interfaceControlType == 3) {
      //  (params.goldSaleFeeCalcType == "按克")
      // if (fieldName == "fQuotePrice" ) {
      //   // 改后更新实退价＝零售价×折扣率%÷100、折扣额＝数量×（零售价－实退价）、实退金额＝数量×实退价
      //   fPrice = calculate_Multiply(fQuotePrice, goldFeeDiscountRate / 100, numPoint_Price);
      //   fMoney = calculate_Multiply(fPrice, fQuantity, numPoint_Money);
      //   goldFeeDiscountMoney = calculate_Multiply(fQuantity, calculate_Subtract(fQuotePrice, fPrice), numPoint_Money);
      //   changeValues.push({ "fieldName": fieldName, "fieldValue": fieldValue });
      //   changeValues.push({ "fieldName": "fPrice", "fieldValue": fPrice });
      //   changeValues.push({ "fieldName": "fMoney", "fieldValue": fMoney });
      //   changeValues.push({ "fieldName": "goldFeeDiscountMoney", "fieldValue": goldFeeDiscountMoney });
      //   dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      // }
      if (fieldName == 'foldPrice' || fieldName == 'goldFeeDiscountRate') {
        // 改后更新实退价＝零售价×折扣率%÷100、折扣额＝数量×（零售价－实退价）、实退金额＝数量×实退价
        fPrice = calculate_Multiply(foldPrice, goldFeeDiscountRate / 100, numPoint_Price);
        fMoney = calculate_Multiply(fPrice, fQuantity, numPoint_Money);
        goldFeeDiscountMoney = calculate_Multiply(fQuantity, calculate_Subtract(foldPrice, fPrice), numPoint_Money);
        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        changeValues.push({ fieldName: 'fPrice', fieldValue: fPrice });
        changeValues.push({ fieldName: 'fMoney', fieldValue: fMoney });
        changeValues.push({ fieldName: 'goldFeeDiscountMoney', fieldValue: goldFeeDiscountMoney });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
      // wangjiuling:金一需求问题，非原单退货界面修改零售价需联动修改原销售价、实退价；并且需控制如果修改原销售价、实退价不能更新零售价
      else if (fieldName == 'fQuotePrice' && params.returnProductType == '2') {
        const foldPrice = fQuotePrice;

        fPrice = calculate_Multiply(foldPrice, goldFeeDiscountRate / 100, numPoint_Price);
        fMoney = calculate_Multiply(fPrice, fQuantity, numPoint_Money);
        goldFeeDiscountMoney = calculate_Multiply(fQuantity, calculate_Subtract(foldPrice, fPrice), numPoint_Money);

        changeValues.push({ fieldName: 'fQuotePrice', fieldValue: fQuotePrice });
        changeValues.push({ fieldName: 'foldPrice', fieldValue: foldPrice });

        changeValues.push({ fieldName: 'fPrice', fieldValue: fPrice });
        changeValues.push({ fieldName: 'fMoney', fieldValue: fMoney });
        changeValues.push({ fieldName: 'goldFeeDiscountMoney', fieldValue: goldFeeDiscountMoney });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
      // wangjiuling:金一需求问题，非原单退货界面修改零售价需联动修改原销售价、实退价；并且需控制如果修改原销售价、实退价不能更新零售价
      // else if (fieldName == "fQuotePrice" && params.returnProductType == "2") {
      //   changeValues.push({ "fieldName": "fQuotePrice", "fieldValue": fieldValue });
      //   changeValues.push({ "fieldName": "foldPrice", "fieldValue": fieldValue });
      //   changeValues.push({ "fieldName": "fPrice", "fieldValue": fieldValue });
      //   dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      // }
      else if (fieldName == 'fPrice') {
        // 折扣率%＝实退价÷零售价×100、折扣额＝数量×（零售价－实退价）、实退金额＝数量×实退价
        // goldFeeDiscountRate = calculate_Multiply((calculate_Divide(fPrice, foldPrice)), 100, numPoint_Rate);
        // goldFeeDiscountMoney = calculate_Multiply(calculate_Subtract(foldPrice, fPrice, 2), fQuantity, numPoint_Money);
        // fMoney = calculate_Multiply(fPrice, fQuantity, numPoint_Money);
        // 实退金额＝数量×实退价，退货折扣额＝数量×原销售价－实退金额，退货折扣率＝实退价÷原销售价×100
        fMoney = calculate_Multiply(fPrice, fQuantity, numPoint_Money);
        goldFeeDiscountMoney = calculate_Subtract(calculate_Multiply(foldPrice, fQuantity, 2), fMoney, numPoint_Money);
        goldFeeDiscountRate = calculate_Multiply((calculate_Divide(fPrice, foldPrice)), 100, numPoint_Rate);

        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        changeValues.push({ fieldName: 'goldFeeDiscountMoney', fieldValue: goldFeeDiscountMoney });
        changeValues.push({ fieldName: 'goldFeeDiscountRate', fieldValue: goldFeeDiscountRate });
        changeValues.push({ fieldName: 'fMoney', fieldValue: fMoney });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
      else if (fieldName == 'goldFeeDiscountMoney') {
        // 实退价＝零售价－折扣额÷数量、折扣率＝实退价÷零售价×100、实退金额＝数量×实退价
        // fPrice = calculate_Subtract(foldPrice, calculate_Divide(goldFeeDiscountMoney, fQuantity, 4), numPoint_Price);
        // goldFeeDiscountRate = calculate_Multiply(calculate_Divide(fPrice, foldPrice), 100, numPoint_Rate);
        // fMoney = calculate_Multiply(fPrice, fQuantity, numPoint_Money);
        // 实退金额＝数量×原销售价－退货折扣额，实退价＝＝实退金额÷数量、退货折扣率＝实退价÷零售价原销售价×100、实退金额＝数量×实退价；
        fMoney = calculate_Subtract(calculate_Multiply(fQuantity, foldPrice, numPoint_Money), goldFeeDiscountMoney, numPoint_Money);
        fPrice = calculate_Divide(fMoney, fQuantity, numPoint_Price);
        goldFeeDiscountRate = calculate_Multiply(calculate_Divide(fPrice, foldPrice), 100, numPoint_Rate);

        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        changeValues.push({ fieldName: 'goldFeeDiscountRate', fieldValue: goldFeeDiscountRate });
        changeValues.push({ fieldName: 'fPrice', fieldValue: fPrice });
        changeValues.push({ fieldName: 'fMoney', fieldValue: fMoney });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
      else if (fieldName == 'fQuantity') { // 改后更新实退价＝零售价×折扣率%÷100、折扣额＝数量×（零售价－实退价）、实退金额＝数量×实退价
        fQuantity = calculate_Multiply(1, fQuantity, numPoint_Quantity);
        if (!isNaN(fQuantity) && fQuantity != '') {
          if (Number(fQuantity) > 0)
            fQuantity = 0 - Number(fQuantity);
        }
        goldFeeDiscountMoney = calculate_Multiply(fQuantity, calculate_Subtract(foldPrice, fPrice), numPoint_Money);
        fMoney = calculate_Multiply(fPrice, fQuantity, numPoint_Money);
        changeValues.push({ fieldName: fieldName, fieldValue: fQuantity });
        changeValues.push({ fieldName: 'goldFeeDiscountMoney', fieldValue: goldFeeDiscountMoney });
        changeValues.push({ fieldName: 'fMoney', fieldValue: fMoney });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
      else if (fieldName == 'fMoney') {
        //  实退金额：显示“实退价×数量”，可改，小于等于零，改后重算实退价＝实退金额÷数量、折扣率＝实退价÷零售价×100、折扣额＝数量×（零售价－实退价）
        // fPrice = calculate_Divide(fMoney, fQuantity, numPoint_Price);
        // goldFeeDiscountRate = calculate_Multiply((calculate_Divide(fPrice, foldPrice)), 100, numPoint_Rate);
        // goldFeeDiscountMoney = calculate_Multiply(calculate_Subtract(foldPrice, fPrice, 2), fQuantity, numPoint_Money);
        // 退货折扣额＝数量×原销售价－实退金额，重算实退价＝实退金额÷数量，退货折扣率＝实退价÷原销售价×100
        goldFeeDiscountMoney = calculate_Subtract(calculate_Multiply(foldPrice, fQuantity, 2), fMoney, numPoint_Money);
        fPrice = calculate_Divide(fMoney, fQuantity, numPoint_Price);
        goldFeeDiscountRate = calculate_Divide(fPrice * 100, foldPrice, numPoint_Rate);

        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        changeValues.push({ fieldName: 'fPrice', fieldValue: fPrice });
        changeValues.push({ fieldName: 'goldFeeDiscountRate', fieldValue: goldFeeDiscountRate });
        changeValues.push({ fieldName: 'goldFeeDiscountMoney', fieldValue: goldFeeDiscountMoney });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }

      else {
        changeValues.push({ fieldName: fieldName, fieldValue: fieldValue });
        dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_ValueChange', { changeValues }));
      }
    }
  }
}

function parseUpdateNumber (fieldValue) {
  if (fieldValue === undefined || isNaN(fieldValue) == true || fieldValue === '') {
    return undefined;
  }
  else {
    return Number(fieldValue);
  }
}

export function UpdateBackInfo_execUpdate (dispatch, params, backReason, globalState, callback) {
  // let numPoint_Price = calculate_ConvertToCalcValue(mixRedux.getOptions().monovalentdecimal.value, 2);
  const numPoint_Money = calculate_ConvertToCalcValue(mixRedux.getOptions().amountofdecimal.value, 2);
  // let numPoint_Quantity = calculate_ConvertToCalcValue(mixRedux.getOptions().numPoint_Quantity.value, 2);
  // let numPoint_Weight = calculate_ConvertToCalcValue(mixRedux.getOptions().numPoint_Weight.value, 2);
  // let numPoint_Rate = calculate_ConvertToCalcValue(mixRedux.getOptions().numPoint_Rate.value, 2);

  const productDefine = 'product_productProps!define'; // 商品自定义项
  // let skuDefine = "product_productSkuProps!define"; // SKU自定义项
  const detailDefine = 'retailVouchDetailCustom!define'; // 表体自定义项
  const curData = params.backArray[params.loopNum];
  const loopNums = params.backArray.length;
  let iBackid_reason = '';

  const origin_foldDiscount = curData.foldDiscount || 0;

  backReason.forEach((ele) => {
    if (ele.reasonTypeId == 2 && ele.id == params.iBackid)
      iBackid_reason = ele.reason;
  });
  if (params.interfaceControlType == 0) {
    curData.fQuantity = parseUpdateNumber(params.fQuantity);
    curData.fQuotePrice = parseUpdateNumber(params.fQuotePrice);
    curData.fQuoteMoney = parseUpdateNumber(calculate_Multiply(params.fQuotePrice, params.fQuantity, numPoint_Money));
    curData.fPrice = parseUpdateNumber(params.fPrice);
    curData.fMoney = parseUpdateNumber(params.fMoney);
    curData.iBackid = params.iBackid;
    curData.iBackid_reason = iBackid_reason;
    curData.dCoSaleDate = params.saleDate;
  }
  else if (params.interfaceControlType == 1) {
    curData[detailDefine + '1'] = parseUpdateNumber(params.goldWeight);// 重量（＝重量）、
    curData[detailDefine + '2'] = parseUpdateNumber(params.goldPrice);// 金价（＝金价）、
    curData[detailDefine + '7'] = parseUpdateNumber(params.goldRecycleLossRate);// 回收损耗率 %（＝回收损耗率 %）、
    curData[productDefine + '3'] = parseUpdateNumber(params.goldRecycleFee);// 销售工费（＝回收工费）、
    curData[detailDefine + '3'] = parseUpdateNumber(params.goldRecycleFee);// 销售工费（＝回收工费）、
    curData.fPrice = parseUpdateNumber(params.fPrice);// 零售价（实退价）、
    curData.fQuotePrice = parseUpdateNumber(params.fPrice);// 实销价（实退价）、
    curData.fQuoteMoney = parseUpdateNumber(calculate_Multiply(params.fPrice, params.fQuantity, numPoint_Money));
    curData.fMoney = parseUpdateNumber(calculate_Multiply(params.fPrice, params.fQuantity, numPoint_Money));// 实销金额（实退价×表体数量）、
    curData.iBackid = params.iBackid;// 退货原因、
    curData.iBackid_reason = iBackid_reason;
    curData.dCoSaleDate = params.saleDate; // 原销售日期

    curData.foldPrice = parseUpdateNumber(params.fPrice);// 原销售价 = 实退价

    curData.foldDiscount = 0;// 原单折扣额
    curData.fCoDiscount = 0;// 退货折扣额
    curData.fDiscount = 0;// 综合折扣额
    curData.fDiscountRate = 100; // 折扣率
    // 确定后，更新表体重量（＝重量）、金价（＝金价）、回收损耗率%（＝回收损耗率%）、销售工费（＝回收工费）、
    // 零售价（实退价）、原销售价（实退价）、单价（实退价）、折扣额（0）、折扣率（100%）、
    // 零售金额（零售价×表体数量）、金额（实退价×表体数量）、退货原因、原销售日期、
    // 原单折扣额（0）、退货折扣额（0）、折扣额（0）
  }
  else if (params.interfaceControlType == 2) {
    curData[detailDefine + '2'] = parseUpdateNumber(params.goldPrice); //  金价、
    curData[detailDefine + '3'] = parseUpdateNumber(params.goldSaleFee); //  销售工费、
    curData.fQuotePrice = parseUpdateNumber(params.fQuotePrice); //  零售价、
    curData.fQuoteMoney = parseUpdateNumber(calculate_Multiply(params.fQuotePrice, params.fQuantity, numPoint_Money));
    curData.fPrice = parseUpdateNumber(params.fPrice); //  实销价（实退价）、
    curData.fDiscount = parseUpdateNumber(params.goldFeeDiscountMoney); //  折扣额（折扣额）、
    curData.fCoDiscount = parseUpdateNumber(params.goldFeeDiscountMoney); //  折扣额（折扣额）、
    curData.fDiscountRate = parseUpdateNumber(params.goldFeeDiscountRate); //  折扣率、
    curData.fMoney = parseUpdateNumber(params.goldReturnMoney); //  实销金额（表体数量×实退价）
    curData.iBackid = params.iBackid;// 退货原因、
    curData.iBackid_reason = iBackid_reason;
    curData.dCoSaleDate = params.saleDate; // 原销售日期

    curData.foldPrice = parseUpdateNumber(params.fQuotePrice);// 原销售价 = 零售价
    curData.foldDiscount = 0;// 原单折扣额

    // 确定后，更新表体金价、销售工费、零售价、原销售价（零售价）、单价（实退金额÷表体数量）、
    // 折扣额（退货折扣额）、原单折扣额（0）、退货折扣额（退货折扣额）、折扣率（退货折扣率）、
    // 零售金额（零售价×表体数量）、金额（实退金额）、退货原因、原销售日期
  }

  else if (params.interfaceControlType == 3) {
    curData[detailDefine + '1'] = parseUpdateNumber(params.goldWeight);// 重量（＝重量）、
    curData.fQuotePrice = parseUpdateNumber(params.fQuotePrice); // 零售价、
    curData.fQuoteMoney = parseUpdateNumber(calculate_Multiply(params.fQuotePrice, params.fQuantity, numPoint_Money));
    curData.fPrice = parseUpdateNumber(params.fPrice); // 实销价、
    curData.fMoney = parseUpdateNumber(params.fMoney); // 实销金额（实销金额）、

    // curData['fDiscountRate'] = parseUpdateNumber(params.goldFeeDiscountRate); // 折扣率

    curData.fDiscountRate = calculate_Divide(curData.fPrice, curData.fQuotePrice, 4) * 100; // 折扣率

    curData.iBackid = params.iBackid;// 退货原因、
    curData.iBackid_reason = iBackid_reason;
    curData.dCoSaleDate = params.saleDate; // 原销售日期
    const returnProductType = params.returnProductType;// (1原单2非原单)

    // 原单折扣额(原单退货且未修改数量时，不更新，否则，＝数量×(零售价－原销售价))
    if (returnProductType == 2 || calculate_Subtract(parseUpdateNumber(curData.fQuantity) - parseUpdateNumber(params.fQuantity)) != 0) {
      curData.foldDiscount = Number(calculate_Multiply(parseUpdateNumber(params.fQuantity), calculate_Subtract(parseUpdateNumber(params.fQuotePrice), parseUpdateNumber(params.foldPrice))));
    }
    curData.fQuantity = parseUpdateNumber(params.fQuantity); // 数量（数量）
    curData.fCoDiscount = parseUpdateNumber(calculate_Add(params.goldFeeDiscountMoney, 0)); // 折扣额（折扣额）、
    curData.fDiscount = parseUpdateNumber(calculate_Add(curData.foldDiscount, params.goldFeeDiscountMoney)); // 综合折扣额
    curData.foldPrice = parseUpdateNumber(calculate_Add(params.foldPrice, 0));
  }
  const money_map = globalState.product.toJS().money;
  money_map.FoldDiscount.value = money_map.FoldDiscount.value + (curData.foldDiscount - origin_foldDiscount);
  // dispatch(genAction('PLATFORM_UI_BILLING_UPDATE_PRODUCT', curData));
  callback(true, curData);
  /* lz 更新moneyMap */
  dispatch(genAction('PLATFORM_UI_BILLING_MERGE_DEEP_IN', money_map.FoldDiscount.value))
  // dispatch(setFocusedRow(curData));
  if (params.loopNum + 1 >= loopNums) {
    dispatch(genAction('PLATFORM_UI_BILLING_Action_HandleCancel'));
    if (params.arraySourceType == '2') {
      dispatch(genAction('PLATFORM_UI_GOODS_REFER_SET_OPTIONS', { focus: true }));
    }
  }
  else
    dispatch(genAction('PLATFORM_UI_BILLING_Action_UpdateBackInfo_LoopNext'));
}

/* add by jinzh1  handleOk 前事件 */
const beforeHandleOk = async (params) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.warpPromiseExecute('beforeHandleOk', params)
}
/* add by jinzh1 handleCancel 前事件 */
const beforeHandleCancel = (params) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeHandleCancel', params)
}
/* bottomAction业务逻辑之前 */
const beforeExecBottomActionLogic = (modalKey_Current) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeExecBottomActionLogic', { key: modalKey_Current })
}

const beforeCouponService = (params) => {
  const billingViewModel = getBillingViewModel();
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeCouponService', { params })
}
