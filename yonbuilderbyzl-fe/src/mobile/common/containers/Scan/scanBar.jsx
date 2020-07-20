/*
* 支付扫码
* */

import React, { Component, createElement } from 'react';
import { Toast } from 'antd-mobile';
import styles from './style.css'
import PropTypes from 'prop-types'
import { store } from '../../../client/client'
import { setFinalPaymodes, setScanCode, handleStoreCard, closePaymodal } from 'src/common/redux/modules/billing/paymode'

export class ScanBar extends Component {
  constructor (props) {
    super(props);

    this.state = {
      open: false,
    };
  }

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  componentDidMount () {
    this.initScanBar();
    console.log(this.props)
  }

  initScanBar () {
    if (!window.plus || !window.plus.barcode) {
      // 测试barcode方法,
      this.barcode = {
        start: () => {
        },
        cancel: () => {
        },
        close: () => {
        },
        setFlash: () => {
        }
      }
      return;
    }
    var styles = { frameColor: '#29E52C', scanbarColor: '#29E52C', background: '#222222' };
    var filters = [plus.barcode.QR, plus.barcode.EAN13, plus.barcode.EAN8, plus.barcode.ITF];
    this.barcode = new plus.barcode.Barcode('barcodepanel', filters, styles);
    this.barcode.onmarked = this.onmarked;
    this.barcode.onerror = this.onerror;
    this.lazyStart();
  }

  onmarked = (type, code, file) => {
    this.setState({ barCode: code });
    console.log(code + '  ' + type + '  ' + file);
    this.saveCode();
    this.lazyStart(true);
  }

  onerror = (error) => {
    Toast.fail('操作出错', 1);
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
    this.barcode.cancel();
    this.barcode.close();
    /* 更新为最初支付方式 */
    this.props._props.dispatch({type: 'PLATFORM_UI_BILLING_MOBILE_RESET_PAYMODES'})
  }

  back () {
    this.close();
    this.context.router.history.goBack();
  }

  // 闪光灯
  setFlash () {
    const blopen = !this.state.open;
    this.setState({ open: blopen });
    this.barcode.setFlash(blopen);
  }

  changeInput (value) {
    this.setState({ barCode: value });
  }

  saveCode = () => {
    this.close()
    this.props.onFulfilled(this.state.barCode)

    // callback
  }

  componentWillUnmount () {
    this.close()
    this.props._props.dispatch(closePaymodal())
  }

  render () {
    // let { isScan } = this.state;
    const originDpr = 1;
    // console.log(document.documentElement.clientHeight%document.documentElement.clientWidth);
    const h = window.screen.height - 185 * originDpr;
    return (
      // <div className={styles.barcode_view}>
      //   <div className="scan-nav">
      //     <span onClick={() => {
      //       this.back()
      //     }} className={styles.tab_left_span}> <i className="icon icon-fanhui"></i> </span>
      //     扫描条形码
      //   </div>
      //   <div>
      //     <div id='barcodepanel' style={{ height: h + 'px' }}></div>
      //   </div>
      // </div>
      <div className='barcode_view' style={{ top: 0, left: 0, width: '100%', height: '100%', textAlign: 'center', backgroundColor: '#000' }}>
        <div style={{ color: '#fff' }} className='scan-nav'>
          <span onClick={() => this.back()} className={styles.tab_left_span}>
            <i className='icon icon-fanhui' /> </span>
          扫码支付
        </div>
        <div className='scan_parent_view'>
          <div id='barcodepanel' style={{ height: h + 'px' }} />
        </div>
      </div>
    )
  }
}

function handleScanBar (props) {
  return <ScanBar _props={props} onFulfilled={barCode => {
    props.dispatch(setScanCode({ barCode, paymentId: props.paymentId, paymentType: props.paymentType }))
    if (props.paymentType == 5) {
      return props.dispatch(handleStoreCard(props))
    }
    return props.dispatch(setFinalPaymodes(props))
  }} />
}

export function connectHistoryState (WrappedComponent) {
  return function (props) {
    const historyStateObj = props.location.state || {}
    return createElement(WrappedComponent, { ...historyStateObj, dispatch: store.dispatch })
  }
}

export const ConnectedScanBar = connectHistoryState(handleScanBar)
