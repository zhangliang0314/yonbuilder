import Immutable from 'immutable'
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
// import { Format } from '@mdf/cube/lib/helpers/formatDate';
import { dealReferReturnProducts, deleteMulteProducts } from './product';
import yardformdata from 'yardformdata'

let i = 0; let cacheCompareData = []; let tempCompareProducts = []; let isServerRequest = false;
const $$initialState = Immutable.fromJS({
  width: 600,
  height: 500,
  isRecognition: false,
  isOpenRecognition: false,
  isAutoRecognition: false,
  imageBase64: null,
  backgroundImg: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQYV2NgYGBIAwAAawBnFm3EEgAAAABJRU5ErkJggg==',
  recognitionUrl: null// 'http://10.11.116.105:5008'
})
export default function ($$state = $$initialState, action) {
  switch(action.type) {
    case 'RECOGNITION_PRODUCT_BASE64':
      return $$state.set('imageBase64', action.payload);
    case 'PLATFORM_UI_TOUCH_RIGHT_CONTENT_SET_OPTIONS':
      return $$state.set('isOpenRecognition', false);
    case 'RECOGNITION_CLOSE_STATUS':
      return $$state.set('isOpenRecognition', action.payload);
    case 'PLATFORM_UI_BILLING_CLEAR_TOUCH':
    case 'PLATFORM_UI_BILLING_CLEAR':
      cacheCompareData = []
      tempCompareProducts = [];
      cb.events.execute('communication', {
        image: null,
        isRecognition: false
      });
      return Immutable.fromJS($$initialState);
    case 'PLATFORM_UI_BILLING_DELETE_PRODUCT':

      return $$state;
    case 'RECOGNITION_PRODUCT_SET_DATA':
      return $$state.merge(action.payload);
    default:
      return $$state
  }
}

export function proxyServer (url, params, callback) {
  var xhr = null;
  if (window.XMLHttpRequest)
  {
    xhr = new XMLHttpRequest();
  }
  else if (window.ActiveXObject)
  {
    xhr = new ActiveXObject('Microsoft.XMLHTTP');
  }
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      cb.utils.loadingControl.end();
      if (xhr.status === 304 || (xhr.status >= 200 && xhr.status < 300)) {
        callback(true, xhr.responseText);
      } else {
        isServerRequest = false;
        switch (xhr.status) {
          case 1001: cb.utils.alert('当前摄像头（摄像头IP/ID）已离线,请检查线路!', 'error'); return;
          case 1002: cb.utils.alert('请求服务地址有误!', 'error'); return;
          case 1003: cb.utils.alert('POS机未指定摄像头ID/IP，请配置！', 'error'); return;
          case 1004: cb.utils.alert('服务内部错误:（错误信息）！', 'error'); return;
          case 1005: cb.utils.alert('服务正在更新，请稍等几秒后重试！', 'error'); return;
          case 2001: cb.utils.alert('称重设备连接异常！', 'error'); return;
          case 2002: cb.utils.alert('无标准重量信息！', 'error'); return;
          case 2003: cb.utils.alert('未获取到重量，请检查托盘是否放置正确！', 'error'); return;
          case 2004: cb.utils.alert('称重量高于标准重量，请检查产品是否有堆叠并重新摆放商品！', 'error'); return;
          case 2005: cb.utils.alert('称重重量低于标准重量，请检查托盘和产品是否摆放正确！', 'error'); return;
          default: cb.utils.alert('物品识别服务器连上不上或连接超时！', 'error');
        }
        // callback(false,xhr.responseText);
      }
    }
  };
  xhr.open('POST', url, true);
  xhr.send(params);
}

// 将图片转换为Base64
export function getImgToBase64 (url, callback, arr, backgroundImg) {
  CanvasRenderingContext2D.prototype.wrapText = function (text, x, y, maxWidth, lineHeight) {
    if (typeof text != 'string' || typeof x != 'number' || typeof y != 'number') {
      return;
    }

    var context = this;
    var canvas = context.canvas;

    if (typeof maxWidth == 'undefined') {
      maxWidth = (canvas && canvas.width) || 300;
    }
    if (typeof lineHeight == 'undefined') {
      lineHeight = (canvas && parseInt(window.getComputedStyle(canvas).lineHeight)) || parseInt(window.getComputedStyle(document.body).lineHeight);
    }

    // 字符分隔为数组
    var arrText = text.split('');
    var line = '';

    for (var n = 0; n < arrText.length; n++) {
      var testLine = line + arrText[n];
      var metrics = context.measureText(testLine);
      var testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = arrText[n];
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
  };

  yardformdata.imageToBase64(url, (base64, canvas, ctx) => {
    if(arr) {
      i = 0;
      tagLoc(canvas, ctx, arr, (canvasObj) => {
        callback && callback(canvasObj.toDataURL('image/jpeg'));
        canvas = null;
      }, backgroundImg);
    }
  })
  // var canvas = document.createElement('canvas'),
  //     ctx = canvas.getContext('2d'),
  //     img = new Image;
  // img.crossOrigin = 'Anonymous';
  // img.onload = function(){
  //     canvas.height = img.height;
  //     canvas.width = img.width;
  //     ctx.drawImage(img,0,0);
  //     if(arr) {
  //         i=0;
  //         tagLoc(canvas,ctx, arr,(canvasObj)=>{
  //             callback && callback(canvasObj.toDataURL('image/jpeg'));
  //             canvas = null;
  //         },backgroundImg);
  //     }
  /** var dataURL = canvas.toDataURL('image/jpeg');
        callback(dataURL);
        canvas = null;**/
  // };
  // img.src = url;
}
const tempRadius = 10; let radiusWidth = 28; const zzwidth = parseFloat(160.00); // 圆角
export function tagLoc (canvas, ctx, arr, callback, backgroundImg) {
  if(arr.length < (i + 1)) {
    callback && callback(canvas);
  }else {
    var arritem = arr[i];
    var myImage = new Image();
    myImage.src = backgroundImg; // 背景图片  你自己本地的图片或者在线图片
    myImage.crossOrigin = 'Anonymous';
    myImage.onload = function () {
      radiusWidth = 28;
      // let pny = radiusWidth/zzwidth;
      let mbian = arritem.x2 - arritem.x1;
      if((arritem.x2 - arritem.x1) > (arritem.y2 - arritem.y1))
        mbian = arritem.y2 - arritem.y1;
      radiusWidth = radiusWidth + ((radiusWidth / zzwidth) * (mbian - zzwidth));
      roundedRect(ctx, arritem.x1, arritem.y1, arritem.x2 - arritem.x1, arritem.y2 - arritem.y1, tempRadius, arritem);

      /** ctx.drawImage(myImage, arritem.x1, arritem.y1, arritem.x2-arritem.x1, arritem.y2-arritem.y1);
            ctx.font = "15px Courier New";
            ctx.fillStyle = "#fff";
            ctx.fillText(arritem.sku_name, arritem.x1+(arritem.x2-arritem.x1-arritem.sku_name.length*8)/2, arritem.y1+20);**/

      var myImage1 = new Image();
      myImage1.src = backgroundImg; // 背景图片  你自己本地的图片或者在线图片
      myImage1.crossOrigin = 'Anonymous';
      myImage1.onload = function () {
        ctx.strokeStyle = '#0091FF';
        ctx.beginPath();

        // 左上
        ctx.moveTo(arritem.x1 + radiusWidth, arritem.y1); // 创建开始点
        ctx.lineTo(arritem.x1 + radiusWidth, arritem.y1); // 创建水平线
        ctx.arcTo(arritem.x1, arritem.y1, arritem.x1, arritem.y1 + tempRadius, tempRadius); // 创建弧
        ctx.lineTo(arritem.x1, arritem.y1 + radiusWidth); // 创建垂直线

        // 左下
        ctx.moveTo(arritem.x1 + radiusWidth, arritem.y2); // 创建开始点
        ctx.lineTo(arritem.x1 + radiusWidth, arritem.y2); // 创建水平线
        ctx.arcTo(arritem.x1, arritem.y2, arritem.x1, arritem.y2 - tempRadius, tempRadius); // 创建弧
        ctx.lineTo(arritem.x1, arritem.y2 - radiusWidth); // 创建垂直线

        // 右上
        ctx.moveTo(arritem.x2 - radiusWidth, arritem.y1); // 创建开始点
        ctx.lineTo(arritem.x2 - radiusWidth, arritem.y1); // 创建水平线
        ctx.arcTo(arritem.x2, arritem.y1, arritem.x2, arritem.y1 + tempRadius, tempRadius); // 创建弧
        ctx.lineTo(arritem.x2, arritem.y1 + radiusWidth); // 创建垂直线

        // 右下
        ctx.moveTo(arritem.x2 - radiusWidth, arritem.y2); // 创建开始点
        ctx.lineTo(arritem.x2 - radiusWidth, arritem.y2); // 创建水平线
        ctx.arcTo(arritem.x2, arritem.y2, arritem.x2, arritem.y2 - tempRadius, tempRadius); // 创建弧
        ctx.lineTo(arritem.x2, arritem.y2 - radiusWidth); // 创建垂直线

        ctx.lineWidth = 2;
        ctx.stroke();
        i++;
        tagLoc(canvas, ctx, arr, callback, backgroundImg);
        myImage1 = null;
        myImage = null;
      }
    }
  }
}

// 画圆角矩形
export function roundedRect (ctx, x, y, width, height, radius, arritem) {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.lineTo(x, y + height - radius);
  ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
  ctx.lineTo(x + width - radius, y + height);
  ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
  ctx.lineTo(x + width, y + radius);
  ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
  ctx.lineTo(x + radius, y);
  ctx.quadraticCurveTo(x, y, x, y + radius);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fill();
  ctx.font = '14px Courier New';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';

  ctx.wrapText(arritem.sku_name, arritem.x1 + (arritem.x2 - arritem.x1) / 2, arritem.y1 + (arritem.y2 - arritem.y1) / 2, width);
  ctx.lineWidth = 1;
  ctx.stroke();
}

// 获得输入框中字符长度
export function getLength (val) {
  var str = String(val);
  var bytesCount = 0;
  for (var i = 0, n = str.length; i < n; i++) {
    var c = str.charCodeAt(i);
    if ((c >= 0x0001 && c <= 0x007e) || (c >= 0xff60 && c <= 0xff9f)) {
      bytesCount += 1;
    } else {
      bytesCount += 2;
    }
  }
  return bytesCount;
}

export function compareProduct (imgbase64, recognitionObj, isAddProduct) {
  return (dispatch, getState) => {
    if(!imgbase64)
      return;
    const recognitionState = getState().recognition.toJS();
    const params = yardformdata.toFormData(imgbase64, 'attach');
    cb.utils.loadingControl.start();
    isServerRequest = true;
    try{
      proxyServer(recognitionObj.recognitionUrl + '/getImgDetect', params, (isSuccuess, data) => {
        isServerRequest = false;
        if(isSuccuess) {
          if(!isAddProduct) {
            if(tempCompareProducts.length > 0) {
              dispatch(deleteMulteProducts(tempCompareProducts));
            }
            dispatch(genAction('RECOGNITION_CLOSE_STATUS', true));
          }
          tempCompareProducts = [];
          dispatch(genAction('RECOGNITION_PRODUCT_SET_DATA', Object.assign(recognitionObj, {imageBase64: imgbase64})));
          const responseObj = JSON.parse(data);
          if(responseObj.data.length === 0) {
            cb.utils.alert('没有识别到商品!', 'info');
            return;
          }
          if(isSameRecognition(responseObj.data)) {
            return;
          }
          cacheCompareData = data;
          getImgToBase64(imgbase64, (ibase64) => {
            dispatch(genAction('RECOGNITION_PRODUCT_BASE64', ibase64));
            const skuCodes = []; const skuProducts = [];
            responseObj.data.map((item, i) => {
              skuCodes.push(item.sku_code);
              skuProducts.push(item);
            });
            cb.utils.loadingControl.start();
            isServerRequest = true;
            dispatch(productRecognition([{
              field: 'productskus.cCode',
              op: 'in',
              value1: skuCodes
            }], skuProducts));
          }, responseObj.loc, recognitionState.backgroundImg);
        }
      })
    }catch(ex) {
      console.log(ex);
    }
  }
}

export function recognitionProduct (isAddProduct) {
  return (dispatch, getState) => {
    if(!cb.recognition)
      return;
    if(isServerRequest)
      return;
    let recognitionObj = null;
    const cacelRecognition = localStorage.getItem('recognitionData') ? JSON.parse(localStorage.getItem('recognitionData')) : null;
    if(cacelRecognition && cacelRecognition.bRecognition) {
      recognitionObj = {recognitionUrl: cacelRecognition.cServerIPAddress};
      if(cacelRecognition.cServerIPAddress)
        recognitionObj.recognitionUrl = cacelRecognition.cServerIPAddress;
      if(cacelRecognition.bRecognitionInterval)
        recognitionObj.isOpenRecognition = !!(cacelRecognition.bRecognitionInterval || cacelRecognition.bRecognitionInterval === '2');
      if(cacelRecognition.bRecognitionPhoto)
        recognitionObj.isAutoRecognition = !!(cacelRecognition.bRecognitionPhoto || cacelRecognition.bRecognitionPhoto === '2');
    }
    if(!recognitionObj || !recognitionObj.recognitionUrl) {
      cb.utils.alert('服务器地址格式不正确', 'error')
      return;
    }
    cb.recognition.cameraPic(function (base64) {
      if(!base64)
        return;
      // dispatch(genAction('RECOGNITION_PRODUCT_BASE64',base64));
      dispatch(compareProduct(base64, recognitionObj, isAddProduct));
    });
  }
}

/** 智能物体识别 */
export function productRecognition (result, skuProducts) {
  return (dispatch, getState) => {
    // let date = Format(new Date(), 'yyyy-MM-dd hh:mm:ss');
    // dispatch(genAction('PLATFORM_UI_BILLING_SELF_SET_OPTIONS', {showView: 'cart'}))
    dispatch(recognitionEnter(result, skuProducts));
    window.__self__type = 'add'
  }
}

/**
 * @param  智能识别商品
*/
export function recognitionEnter (skucodes, skuProducts) {
  return (dispatch, getState) => {
    // let promotionFilter = getState().product.get('promotionFilter') ? getState().product.get('promotionFilter').toJS() : null;
    // let billingStatus = getState().uretailHeader.toJS().billingStatus;
    const recognitionState = getState().recognition.toJS();
    // let isBack = 0;
    const isTable = true;
    // if (billingStatus === 'FormerBackBill' || billingStatus === 'NoFormerBackBill') isBack = 1;
    const tableOrTree = isTable ? 'Y' : 'N';
    let config = {};
    config = {
      url: 'mall/bill/queryProductByConditions',
      method: 'POST',
      params: {
        condition: {
          isExtend: true,
          simpleVOs: skucodes
        },
        externalData: {
          showType: tableOrTree
        }
      }
    };
    proxy(config)
      .then(async (json) => {
        isServerRequest = false;
        // let returnObj_sku = [], returnObj_combo = {};
        if (json.code === 200) {
          const data = json.data;
          if (isTable && data.length > 0) {
            if(skuProducts.length > data.length)
              cb.utils.alert('有识别到的商品在商品档案没匹配到!', 'info');
            data.map((item, i) => {
              item.skuKey = `${item.id}|${item.skuId}`;
              item.exactKey = `${item.id}|${item.skuId}`;
              const skuObj = skuProducts.find((o) => {
                return o.sku_code === item.skuCode
              });
              if(skuObj) {
                item.fQuantity = skuObj.count;
                item.quantity = skuObj.count;
              }
            })
            cb.events.execute('communication', {
              image: recognitionState.imageBase64,
              isRecognition: true
            });
            tempCompareProducts = data;
            dispatch(dealReferReturnProducts({ sku: data}));
          }else{
            cb.utils.alert('商品档案中没有匹配到识别到的商品!', 'info');
          }
        }
      })
  }
}

export const setPrevCompareProducts = (data, callback) => {
  if(tempCompareProducts.length <= 0)
    return;
  data.map((item) => {
    tempCompareProducts.find((item0, index) => {
      if(item0.exactKey === (item.key ? item.key.substring(0, item.key.indexOf('_')) : '')) {
        tempCompareProducts.splice(index, index + 1);
        tempCompareProducts.push(item);
      }
    })
  })
  callback(tempCompareProducts);
}

export function setCaremaStatus (status) {
  return function (dispatch) {
    dispatch(genAction('RECOGNITION_CLOSE_STATUS', status));
  }
}

function isSameRecognition (data) {
  if(data.length != cacheCompareData.length)
    return false;
  let isSameProduct = false;
  data.map((item) => {
    const findOv = cacheCompareData.find((o) => { return o.sku_code === item.sku_code; });
    if(!findOv) {
      isSameProduct = false;
      return;
    }
    if(findOv && findOv.count != item.count) {
      isSameProduct = false;
    }
  })
  return isSameProduct;
}
