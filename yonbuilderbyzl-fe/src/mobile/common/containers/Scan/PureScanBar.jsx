/*
* 支付扫码
* */

import React, {Component } from 'react';
import {Toast} from 'antd-mobile';
import styles from './style.css'
// import PropTypes from 'prop-types'

export class PureScanBar extends Component {
  constructor (props) {
    super(props);
    this.state = {
      open: false,
    };
  }

  componentDidMount () {
    this.initPureScanBar();
  }

  initPureScanBar () {
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
    var styles = {frameColor: '#29E52C', PureScanBarColor: '#29E52C', background: '#222222'};
    var filters = [plus.barcode.QR, plus.barcode.EAN13, plus.barcode.EAN8, plus.barcode.ITF];
    this.barcode = new plus.barcode.Barcode('barcodepanel', filters, styles);
    this.barcode.onmarked = this.onmarked;
    this.barcode.onerror = this.onerror;
    this.lazyStart();
  }

  onmarked = (type, code, file) => {
    this.setState({barCode: code});
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
  }

  componentWillUnmount () {
    this.close()
  }

  // 闪光灯
  setFlash () {
    const blopen = !this.state.open;
    this.setState({open: blopen});
    this.barcode.setFlash(blopen);
  }

  changeInput (value) {
    this.setState({barCode: value});
  }

  saveCode = () => {
    if (typeof this.props.resolve === 'function') {
      this.props.resolve({
        fulfilled: true,
        value: this.state.barCode
      })
    }
  }

  render () {
    // let {isScan} = this.state;
    const originDpr = 1;
    // console.log(document.documentElement.clientHeight%document.documentElement.clientWidth);
    const h = document.documentElement.clientHeight - 185 * originDpr;
    return (
      <div className={styles.barcode_view}>
        <div className='scan-nav'>
          扫描条形码
        </div>
        <div>
          <div id='barcodepanel' style={{height: h + 'px'}} />
        </div>
      </div>
    )
  }
}
