import Immutable from 'immutable';
import { proxy } from '@mdf/cube/lib/helpers/util';
// import { Modal, message } from 'antd';
import * as mixRedux from './mix';
import { getBillingViewModel } from './config';
// import { exec as execPromotion, canOpen as canOpenPromotion } from './ExecutPromotion';
// import { exec as execScene, canOpen as canOpenScene } from './discount';
// import { exec as execQuote, execQuantity as execQuantity, canOpen as canOpenQuote } from './quote';
// import { execEdit, canOpenEdit } from './editRow';

const $$initialState = Immutable.fromJS({
  // actionData: [],
  // modalKey_Current: "",
  // modalKey_Data: {
  //   ModifyQuantity: "ModifyQuantity",//修改数量
  // }
})

function common_CopyData (sourceData, destData, state, subKey) {
  // subKey 进一步区分不同复制

  for (var obj in sourceData) {
    if (destData.hasOwnProperty(obj))
      destData[obj] = sourceData[obj];
  }
}

export default ($$state = $$initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_BILLING_Print_1':
    {
      const $state = $$state.toJS();
      const point = $state.modalData[$state.modalKey_Data.DoSaleByVipPoint];
      const data = action.payload.data;
      common_CopyData(data, point.data, $state);
      point.voucherData.voucherDataAfter = action.payload.voucherDataAfter;
      $state.modalData.DoSaleByVipPoint.bHasEffectiveData = true;
      $state.modalData.DoSaleByVipPoint.bHasEditData = false;
      $state.modalKey_Current = '';
      return Immutable.fromJS($state);
    }
    default:
      return $$state;
  }
}
function _localPrint (data) {
  /* add by jinzh1 打印数量 */
  const options = mixRedux.getOptions();
  data.billingcopiesofprintcopies = options.billingcopiesofprintcopies ? options.billingcopiesofprintcopies.value : 1;
  cb.utils.localPrint(data);
}
async function localPrint (code, billingStatus) {
  // 本地打印// http://localhost:3003/uniform/bill/detail?token=c3cd4031af1f49ed9b408f6f21c13a16&billnum=rm_retailvouch&id=432694843560192
  let cachePrintTemplate = localStorage.getItem('billing_printTemplate');
  const otherTemplate = await beforeLocalprint()
  if (otherTemplate) cachePrintTemplate = otherTemplate;
  const templateCode = mixRedux.getOptions().billdefaulttype && mixRedux.getOptions().billdefaulttype.value;
  if (!cachePrintTemplate) {
    if (cb.utils.isEmpty(templateCode)) {
      cb.utils.alert('没有设置打印模板，请检查')
      return;
    }
    const config = {
      url: 'print/getTemplateContent',
      method: 'POST',
      params: {
        billno: 'rm_retailvouch',
        templateCode
      }
    };
    const json = await proxy(config);
    if (json.code !== 200) {
      cb.utils.alert(`获取打印模板失败：${json.message}`, 'error');
    } else {
      cachePrintTemplate = JSON.stringify(json.data);
      localStorage.setItem('billing_printTemplate', cachePrintTemplate);
    }
  }
  if (cachePrintTemplate && code && typeof code === 'string' && code.startsWith('{')) {
    const data = JSON.parse(cachePrintTemplate);
    data.data = code;
    _localPrint(data);
    return;
  }
  const lastStatus = localStorage.getItem('billing_lastStatus');
  let billno = mixRedux.RetailVouchBillNo;
  const viewModel = getBillingViewModel();
  const configParams = viewModel && viewModel.allActions && viewModel.allActions.find(item => {
    return item.cAction.trim().toLocaleLowerCase() === 'preview';
  });
  const route = configParams && configParams.cSvcUrl || '/report';
  if (billingStatus == 'OnlineBill' || billingStatus == 'OnlineBackBill' || lastStatus === 'OnlineBill' || lastStatus === 'OnlineBackBill') {
    if (billingStatus === 'OnlineBill' || lastStatus === 'OnlineBill')
      billno = mixRedux.MallOrderBillNo
    if (billingStatus === 'OnlineBackBill' || lastStatus === 'OnlineBackBill')
      billno = mixRedux.mallOrderBackBillNo
    // route = '/mall/bill';
  }
  // if(cb.rest.terminalType === 3 && false){
  //   route = '/bill';
  // }
  const url = cachePrintTemplate ? route + '/getPrintDataAsJson' : route + '/getTemplateStructure';
  // let templateCode = "xpdy01";
  // let templateCode = mixRedux.getOptions().billdefaulttype && mixRedux.getOptions().billdefaulttype.value;
  if (cb.utils.isEmpty(templateCode)) {
    cb.utils.alert('没有设置打印模板，请检查')
    return;
  }
  const params = { billno, templateCode };
  if (code && typeof code === 'string' && !code.startsWith('{')) {
    params.code = code;
  } else {
    const ids = localStorage.getItem('billing_lastBillId');
    params.ids = new Array(ids);
  }
  let getServiceAgain = false;
  const callback = (json) => {
    if (json.code !== 200) {
      cb.utils.alert('GetTemplate  Error  ' + json.message, 'error');
      console.log('GetTemplate  Error  ' + json.message);
    }
    else {
      if (!json.data && getServiceAgain === false) {
        getServiceAgain = true
        setTimeout(() => {
          actionsProxy(url, 'POST', params, callback)
        }, 1000)
        return
      }
      console.log('GetTemplate  ' + json.message);
      let data;
      if (cachePrintTemplate) {
        data = JSON.parse(cachePrintTemplate);
        data.data = json.data;
      } else {
        data = json.data;
        const { dataSource, tempJson } = data;
        localStorage.setItem('billing_printTemplate', JSON.stringify({ dataSource, tempJson }));
      }
      _localPrint(data);
    }
  }
  actionsProxy(url, 'POST', params, callback);
};
function cloudPrint (code, billingStatus) {
  // 云打印
  const url = 'print/printPreview.do';
  const viewModel = getBillingViewModel();
  const configParams = viewModel && viewModel.allActions && viewModel.allActions.find(item => {
    return item.cAction.trim().toLocaleLowerCase() === 'preview';
  });
  let route = configParams && configParams.cSvcUrl || '/report';
  // let template = "wjl001";//袁慧预置模板，奇功提供获取模板信息
  // let template = mixRedux.getOptions().billdefaulttype ? mixRedux.getOptions().billdefaulttype.value : "wjl001";
  const template = mixRedux.getOptions().billdefaulttype && mixRedux.getOptions().billdefaulttype.value;
  if (cb.utils.isEmpty(template)) {
    cb.utils.alert('没有设置打印模板，请检查')
    return;
  }
  const lastStatus = localStorage.getItem('billing_lastStatus');
  let billno = mixRedux.RetailVouchBillNo;
  if (billingStatus == 'OnlineBill' || billingStatus == 'OnlineBackBill' || lastStatus === 'OnlineBill' || lastStatus === 'OnlineBackBill') {
    if (billingStatus === 'OnlineBill' || lastStatus === 'OnlineBill')
      billno = mixRedux.MallOrderBillNo
    if (billingStatus === 'OnlineBackBill' || lastStatus === 'OnlineBackBill')
      billno = mixRedux.mallOrderBackBillNo
    route = '/mall/bill';
  }
  const params = { template, billno, route };
  if (code && typeof code === 'string' && !code.startsWith('{')) {
    params.code = code;
  } else {
    const ids = localStorage.getItem('billing_lastBillId');
    params.ids = new Array(ids);
  }
  if (!beforeCloudPrit(params)) return
  const proxy = cb.rest.DynamicProxy.create({ print: { url, method: 'POST', options: { async: false } } });
  const data = proxy.print(params);
  if (data.error) {
    console.log(data.error.message);
  } else {
    // window.open((cb.electron.getSharedObject() ? '/print/touch?src=' : '') + data.result);
    if (cb.electron.getSharedObject()) {
      const { serviceUrl, token } = cb.rest.AppContext;
      cb.electron.sendOrder('openExternal', `${serviceUrl}${data.result}&token=${token}`);
    } else {
      window.open(data.result);
    }
  }
}
export function print (code) {
  return function (dispatch, getState) {
    // let printType = 2; // 1-POS打印；2-单据打印

    const printType = mixRedux.getOptions().billprinttype ? mixRedux.getOptions().billprinttype.value : 1;
    const billingStatus = getState().uretailHeader.toJS().billingStatus;
    const middle = {code}
    beforePrint(middle, function () {
      code = middle.code
      if (printType == 1) {
        localPrint(code, billingStatus);
      }
      if (printType == 2) {
        if((window.plus && window.plus.JavaToJs)) {
          cb.utils.alert('此模式下无法进行云打印,请重新设置！！', 'error');
        } else{
          cloudPrint(code, billingStatus);
        }
      }
    })
  }
}
function actionsProxy (url, method, params, callback) {
  const config = { url: url, method: method, params: params };
  proxy(config)
    .then(json => {
      callback(json);
    });
}
// function actionsProxy2(url, method, params, callback, uniform) {
//   const config = { url: url, method: method, params: params, options: { uniform: uniform } };
//   proxy(config)
//     .then(json => {
//       callback(json);
//     });
// }

const beforeLocalprint = () => {
  const billingViewModel = getBillingViewModel()
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  const obj = {}
  return new Promise((resolve, reject) => {
    obj.callback = resolve;
    billingViewModel.execute('beforeLocalprint', obj)
  })
}

const beforePrint = (middle, callback) => {
  const billingViewModel = getBillingViewModel()
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    callback()
    return false
  }
  return billingViewModel.promiseExecute('beforePrint', {middle}, callback)
}

const beforeCloudPrit = (params) => {
  const billingViewModel = getBillingViewModel()
  if (!billingViewModel) {
    cb.utils.alert('正在初始化，请稍后重试', 'error');
    return false
  }
  return billingViewModel.execute('beforeCloudPrit', {params})
}
