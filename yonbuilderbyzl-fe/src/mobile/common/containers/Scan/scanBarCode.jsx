import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styles from './style.css'
import sendScanAction from '../../reducers/modules/scanBarcode';

class ScanBarcode extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor (props) {
    super(props);
    this.state = {
      flash: false
    }
    this.actions = props.barcodeActions;
    this.reduxName = this.props.match.params.reduxName;
  }

  componentDidMount () {
    if (window.plus && window.plus.barcode) {
      const filter = [plus.barcode.QR, plus.barcode.EAN13, plus.barcode.EAN8];
      const BarcodeStyles = { frameColor: '#fecb2f', scanbarColor: '#fecb2f' };
      this.scan = new plus.barcode.Barcode('scanId', filter, BarcodeStyles);
      this.scan.onmarked = this.onmarked;
      this.scan.start();
    }
  }

  componentWillUnmount () {
    if (this.scan) {
      this.scan.cancel();
      this.scan.close();
    }
  }

  onmarked = (type, result) => {
    // var text = '未知: ';
    // switch (type) {
    //   case plus.barcode.QR:
    //     text = 'QR: ';
    //     break;
    //   case plus.barcode.EAN13:
    //     text = 'EAN13: ';
    //     break;
    //   case plus.barcode.EAN8:
    //     text = 'EAN8: ';
    //     break;
    // }

    this.props.sendScanAction({ reduxName: this.reduxName, data: result });
    this.scan.cancel();
    this.scan.close();
    this.context.router.history.goBack()
  }

  getScanControl = () => {
    const originDpr = 1;
    const h = window.screen.height - 64 * originDpr;
    return (
      <div className='barcode_view' style={{ top: 0, left: 0, width: '100%', height: '100%', textAlign: 'center', backgroundColor: '#000' }}>
        <div style={{ color: '#fff' }} className='scan-nav'>
          <span onClick={() => this.context.router.history.goBack()} className={styles.tab_left_span}>
            <i className='icon icon-fanhui' /> </span>
          {this.reduxName == 'coupon' ? '扫描优惠券' : '扫描条形码'}
        </div>
        <div className='scan_parent_view'>
          <div id='scanId' style={{ height: h + 'px' }} />
        </div>
      </div>
    );
  }

  render () {
    const control = this.getScanControl();
    return control;
  }
}
function mapStateToProps (state) {
  return {
  }
}

function mapDispatchToProps (dispatch) {
  return {
    sendScanAction: bindActionCreators(sendScanAction, dispatch),
    dispatch,
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ScanBarcode);
