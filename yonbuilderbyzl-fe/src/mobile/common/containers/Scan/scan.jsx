import React, { Component } from 'react';
import { Button, InputItem, WhiteSpace, WingBlank, Flex, Icon } from 'antd-mobile';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { push } from 'react-router-redux'
import styles from './style.css'
import PropTypes from 'prop-types'
import * as barCodeActions from 'src/common/actions/barCode'
import * as referActions from '../../reducers/modules/goodsRefer'
import * as editRowAction from 'src/common/redux/modules/billing/editRow'

let isbackBillingTouch = false;
let tempGoodsList = [];
class ScanCode extends Component {
  constructor (props) {
    super(props);

    this.state = {
      open: false,
      isScan: true,
      isMdfCode: false,
      barCode: '',
      goods: {
        cName: '',
        fQuantity: 1,
        skuSalePrice: 0
      },
      countPrice: 0,
      goodsList: [],
      goodsNum: 0
    };
  }

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  componentDidMount () {
    if (isbackBillingTouch) {
      isbackBillingTouch = false;
      const { salesClerk } = this.props;
      const salesChecked = salesClerk.salesChecked;
      if (salesChecked && salesChecked != '') {
        this.finallyOkClick();
      } else {
        this.cartRowDelete(null, true)
      }
    } else {
      this.stime = new Date().getTime();
      this.initScanBar();
    }
  }

  initScanBar () {
    const initScanTime = setTimeout(function () {
      clearTimeout(initScanTime);
      if (!window.plus || !window.plus.barcode) {
        // 测试barcode方法,
        this.barcode = {
          start: () => { },
          cancel: () => { },
          close: () => { },
          setFlash: () => { }
        }
        return;
      }
      var styles = { frameColor: '#ee2223', scanbarColor: '#ee2223', backgroundColor: '#222222' };
      var filters = [plus.barcode.QR, plus.barcode.EAN13, plus.barcode.EAN8, plus.barcode.CODE128, plus.barcode.CODE39, plus.barcode.CODE93, plus.barcode.AZTEC];
      this.barcode = new plus.barcode.Barcode('barcodepanel', filters, styles);
      this.barcode.onmarked = this.onmarked;
      this.barcode.onerror = this.onerror;
      this.lazyStart();
    }.bind(this), 200);
  }

  /* 删除购物车商品行 */
  cartRowDelete (ele, isAllDelete) {
    const { cartInfo } = this.props.goodsRefer.toJS();
    if (!ele && isAllDelete) {
      cartInfo.cartData = [];
      cartInfo.numObj = {};
      cartInfo.cartVisible = false;
      this.props.referActions.setOptions({ cartInfo })
      return
    }
    const index = cartInfo.cartData.findIndex(product => {
      return product.exactKey == ele.exactKey
    })
    if (index !== -1) {
      delete cartInfo.numObj[cartInfo.cartData[index].exactKey]
      cartInfo.cartData.splice(index, 1)
      if (cartInfo.cartData.length == 0)
        cartInfo.cartVisible = false
      this.props.referActions.setOptions({ cartInfo })
    }
  }

  onmarked = (type, code, file) => {
    this.setState({ barCode: code });
    console.log(code + '  ' + type + '  ' + file);
    this.saveCode();
    this.lazyStart(true);
  }

  onerror = (error) => {
    cb.utils.Toast('操作出错', 'fail');
    // Toast.fail('操作出错', 2);
    console.log(error);
    this.lazyStart(true);
  }

  lazyStart (bl) {
    if (bl) {
      const calTime = setTimeout(function () {
        clearTimeout(calTime);
        this.barcode.start();
      }.bind(this), 1000);
    } else {
      this.barcode.start();
    }
  }

  // 释放
  close () {
    if (this.barcode) {
      this.barcode.cancel();
      this.barcode.close();
    }
  }

  back () {
    this.context.router.history.goBack();
  }

  // 闪光灯
  setFlash () {
    const blopen = !this.state.open;
    this.setState({ open: blopen });
    this.barcode.setFlash(blopen);
  }

  // 输入商品码
  changeInput (value) {
    this.setState({ barCode: value });
  }

  // 扫描网络请求成功后的回调保存
  saveCode () {
    if (this.state.barCode === '' || this.state.barCode === null)
      return;

    if (this.state.isScan) {
      this.close();
    }

    const { barCodeActions } = this.props;
    barCodeActions.scanReferReturn(this.state.barCode, cb.utils.getNowFormatDate(), function (data) {
      if (!cb.utils.isEmpty(data)) {
        let skuSalePrice = data.skuSalePrice;
        if (!data.skuSalePrice) {
          skuSalePrice = 0.00;
        }
        this.setState({ countPrice: parseFloat(skuSalePrice).toFixed(2), isMdfCode: true, goods: data });
        console.log('添加商品码---');
      } else {
        cb.utils.Toast('未识别到该商品', 'error', 100);
        if (this.state.isScan) {
          this.initScanBar();
        }
      }
    }.bind(this));
    // saveCode(this,function(){
    //   this.setState({isMdfCode:true});
    //   console.log("添加商品码---");
    // }.bind(this));
  }

  // 切换到手动输入
  handInputView (bl) {
    if (parseInt(new Date().getTime()) - parseInt(this.stime) < 1000) {
      return;
    }
    if (bl) {
      cb.utils.setStatusBarStyle('light');
      this.initScanBar();
    } else {
      cb.utils.setStatusBarStyle('dark');
      this.close();
      this.open_soft_keyboard();
    }
    this.setState({ isScan: bl });
  }

  // 弹出键盘
  open_soft_keyboard () {
    if (!window.plus || !window.plus.os) {
      return;
    }
    if (plus.os.name == 'iOS') {
      setTimeout(function () {
        var wv_current = plus.webview.currentWebview().nativeInstanceObject();
        wv_current.plusCallMethod({ setKeyboardDisplayRequiresUserAction: false });
        this.customFocusInst.focus();
      }.bind(this), 200);
    } else {
      // 因为安卓autofocus只有4.0版本以上才支持，所以这里使用native.js来强制弹出
      const focusTime = setTimeout(function () {
        clearTimeout(focusTime);
        this.customFocusInst.focus();
      }.bind(this), 300);
    }
  }

  // 扫描
  scanView () {
    const { isScan, goodsNum } = this.state;
    // let { referActions } = this.props;
    const originDpr = 1;
    // console.log(document.documentElement.clientHeight%document.documentElement.clientWidth);
    const h = window.screen.height - 245 * originDpr;
    let lightStatus = 'icon ';
    if (isScan) {
      if (this.state.open) {
        lightStatus = lightStatus + 'icon-kaiguan2';
      } else {
        lightStatus = lightStatus + 'icon-kaiguan1';
      }
    }
    return (
      <div className='scan_parent_view'>
        <div id='barcodepanel' style={{ height: h + 'px' }} />

        <div style={{ display: (!isScan ? 'none' : 'block') }}>
          {/* <div className={styles.scan_desc_v}>将二维码/条码放入框内，即可自动扫码</div> */}
          <div className='clearfix scan_desc_v'>
            <span onClick={() => { this.handInputView(!isScan) }} className='tab_right_span'>{isScan ? '手工输入' : '切换扫描'}<i className='icon icon-shoudongshuru' /></span>
            <span onClick={() => { this.setFlash() }} className='tab_right_span'>{isScan ? (!this.state.open ? '开灯' : '关灯') : ''}
              <i className={lightStatus} /></span>
          </div>
          <div className='car_view'>
            <div onClick={() => { this.finallyOkClick() }} className='car_radius_v'>
              <Icon type='icon-yixuanshangpincopy' className='icon-yixuanshangpincopy' />
              <i>{goodsNum}</i>
              <p>选好了</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  inputCodeFocus (e) {
    console.log(e);
  }

  /* 商品参照最后确定 */
  finallyOkClick = () => {
    let { goodsList } = this.state;
    const { referActions, dispatch, salesClerk } = this.props;
    // const { billingStatus } = uretailHeader;
    /// /以下是在将商品添加到购物时，判断是否有营业，如没有则跳转到营业员界面。
    const salesChecked = salesClerk.salesChecked;
    if (salesChecked && salesChecked != '') {
      if (goodsList.length === 0) {
        goodsList = tempGoodsList;
      }
      referActions.cartToBilling(true, goodsList)
      tempGoodsList = [];
      isbackBillingTouch = false;
      return;
    }
    tempGoodsList = goodsList;
    isbackBillingTouch = true;
    dispatch(push('/billingRefer'));
    // if (billingStatus != 'NoFormerBackBill' && billingStatus != 'FormerBackBill') {
    this.props.editRowAction.showSalesList();
    // }
  }

  // 手动输入码
  inputView () {
    const { isScan, goodsNum } = this.state;
    // let { referActions } = this.props;
    return (
      <div className='han_c_css' style={{ display: (isScan ? 'none' : 'block') }}>
        <div className='bg' />
        <WingBlank size='lg' className={styles.oplm}>
          <InputItem ref={el => { this.customFocusInst = el }} onFocus={this.inputCodeFocus} type='digit' onChange={this.changeInput.bind(this)} clear placeholder='请输入条形码' value={this.state.barCode} />
          <WhiteSpace size='lg' />
          <div className='btns clearfix'>
            <Button onClick={() => { this.handInputView(!isScan) }} type='warning'><i className='icon icon-saoyisao' />切换扫码</Button>
            <Button onClick={() => { this.saveCode() }} type='warning'>立即加入</Button>
          </div>
        </WingBlank>
        <WhiteSpace size='lg' />
        <div className={styles.car_view}>
          <div onClick={() => { this.finallyOkClick() }} className='car_radius_v'>
            <Icon type='icon-yixuanshangpincopy' className='icon-yixuanshangpincopy' />
            <i>{goodsNum}</i>
            <p>选好了</p>
          </div>
        </div>
      </div>
    )
  }

  // 弹窗的取消、确定按钮
  goodsToCar (isAdd) {
    if (this.state.isScan) {
      this.initScanBar();
    }
    // let { referActions } = this.props;
    if (isAdd) {
      let { goodsList, goods, goodsNum } = this.state;
      goodsList.push(goods);
      goodsNum = parseInt(goodsNum) + parseInt(goods.fQuantity);
      this.setState({ goodsList: goodsList, goodsNum: goodsNum });
      // referActions.updateCartInfo(this.state.goods);
      console.log('添加购物车');
    } else {
      console.log('取消购物车');
    }
    this.setState({ isMdfCode: false, barCode: '', goods: { cName: ' ', fQuantity: 1 } });
  }

  // 修改数量
  changeNum (type, value) {
    const temGoods = this.state.goods;
    if (!temGoods || temGoods.cName === null || temGoods.cName === '') {
      return;
    }
    let countPrice = this.state.countPrice;
    // 正常判断点击加减按钮
    if (type === 'add') {
      temGoods.fQuantity = parseInt(temGoods.fQuantity) + 1;
    } else if (type === 'sub') {
      if (temGoods.fQuantity === 1) {
        return;
      }
      temGoods.fQuantity = parseInt(temGoods.fQuantity) - 1;
    }
    let goodsNum = temGoods.fQuantity;
    // 手动输入后的判断
    if (type === '') {
      if (parseInt(value) === 0) {
        temGoods.fQuantity = 1;
      } else {
        temGoods.fQuantity = value;
      }
      if (cb.utils.isEmpty(value)) {
        temGoods.fQuantity = '';
        goodsNum = 1;
      } else {
        goodsNum = temGoods.fQuantity;
      }
    }
    countPrice = parseInt(goodsNum) * parseFloat(temGoods.skuSalePrice);
    this.setState({ countPrice: countPrice.toFixed(2), goods: temGoods });
  }

  // 弹窗修改数量
  modifyNumView () {
    const { isMdfCode, goods, countPrice } = this.state;
    return (
      <div className={styles.mdf_c_css} style={{ display: (isMdfCode ? 'flex' : 'none') }}>
        <div className='mdf_c_pop_css'>
          <WhiteSpace size='lg' />
          <WingBlank size='lg'>
            <div className='title'>{goods.productskus_skuName}</div>
            <div className='money'><i>¥</i>{countPrice}</div>
            <div className={styles.co_style_v}>
              <span onClick={this.changeNum.bind(this, 'sub')}><i className='icon icon-jian' /></span>
              <div style={{ flex: 1, margin: '0 10px' }}>
                <InputItem type='number' onChange={this.changeNum.bind(this, '')} placeholder='输入' value={goods.fQuantity} />
              </div>
              <span onClick={this.changeNum.bind(this, 'add')}><i className='icon icon-jia' /></span>
            </div>
            <Flex>
              <Flex.Item><Button onClick={() => { this.goodsToCar(false) }}>取消</Button></Flex.Item>
              <Flex.Item><Button onClick={() => { this.goodsToCar(true) }} type='warning'>确定</Button></Flex.Item>
            </Flex>
          </WingBlank>
        </div>
      </div>
    )
  }

  render () {
    const { isScan } = this.state;
    return (
      <div style={{ backgroundColor: isScan ? '#000' : '#fff' }} className={styles.barcode_view}>
        <div style={{ color: !isScan ? '#222' : '#fff' }} className='scan-nav'>
          <span onClick={() => { this.back() }} className={styles.tab_left_span}> <i className='icon icon-fanhui' /> </span>
          {isScan ? '扫描条形码' : '手动输入条形码'}
        </div>
        <div>
          {this.scanView()}
          {this.inputView()}
          {this.modifyNumView()}
        </div>
      </div>
    )
  }

  componentWillUnmount () {
    this.close();
  }
}

function mapStateToProps (state) {
  return {
    uretailHeader: state.uretailHeader.toJS(),
    goodsRefer: state.goodsRefer,
    barCodes: state.barCode,
    salesClerk: state.salesClerk.toJS(),
  };
}

function mapDispatchToProps (dispatch) {
  return {
    editRowAction: bindActionCreators(editRowAction, dispatch),
    referActions: bindActionCreators(referActions, dispatch),
    barCodeActions: bindActionCreators(barCodeActions, dispatch),
    dispatch,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ScanCode)
