import React, { Component } from 'react';
import { List, InputItem } from 'antd-mobile';
import { goBack } from 'react-router-redux'
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar'
import addEventListener from 'add-dom-event-listener'
import { setPresellMoney, setFinalPaymodes, ConfigOptions, closePaymodal } from 'src/common/redux/modules/billing/paymode'
import { store } from '../../../client/index'

// todo 根据预订金额比例设置下限
let tempaidIn = 0;
export default class SettleReceipts extends Component {
  constructor (props) {
    super(props)
    const params = this.props.location.state || {}
    const { paidIn } = params
    this.state = {
      receipts: paidIn + ''
    }
    tempaidIn = paidIn;
  }

  componentDidMount () {
    this.moneyInput.focus()
    setTimeout(() => {
      this.confirmBtn = document.querySelector('.keyboard-confirm')
      this.unlistener = addEventListener(this.confirmBtn, 'click', this.onConfirmClick)
    })
    window.webViewEventHand.addEvent('backClick', () => {
      this.goback();
    });
  }

  // 目前只有现销
  validate () {

  }

  onConfirmClick = (e) => {
    // 保持键盘的浮层状态
    e.stopPropagation()

    const { receipts } = this.state
    const params = this.props.location.state || {}
    const { paymentId, storage_balance, isStorageUsed, billingStatus, minReceivable } = params

    const maxzerolim = _.get(ConfigOptions, 'maxzerolim.value')

    if (billingStatus === 'PresellBill' || billingStatus === 'Shipment') {
      if (parseFloat(receipts) < parseFloat(minReceivable)) {
        cb.utils.Toast('应收金额不能小于最低订金金额(' + minReceivable + ')', 'info');
        return;
      }
      if (receipts <= tempaidIn && billingStatus === 'PresellBill') {
        store.dispatch(setPresellMoney(receipts));
      }
    } else if (billingStatus === 'FormerBackBill' || billingStatus === 'NoFormerBackBill') {
      if (parseFloat(receipts) != parseFloat(tempaidIn)) {
        cb.utils.Toast('应收不等于实收，无法结算', 'info');
        return;
      }
    }
    else if (maxzerolim && (billingStatus === 'CashSale' || billingStatus === 'PresellBill' || billingStatus === 'Shipment')) {
      if (parseFloat(receipts) - parseFloat(params.paidIn) > parseFloat(maxzerolim)) {
        cb.utils.Toast('超出最大找零金额，无法结算', 'info');
        return;
      }
    }
    // handleSettlePayment({receivable, receipts, billingStatus, storage_balance: 0, dispatch: this.props.dispatch})
    store.dispatch(setFinalPaymodes({
      billingStatus: billingStatus,
      isStorageUsed,
      paymentId,
      paidIn: receipts,
      storage_balance
    }))
  }

  componentWillUnmount () {
    // typeof this.unlistener === 'function' && this.unlistener()
    this.unlistener.remove();
    this.unlistener = null;
    window.webViewEventHand.cancelEvent(null);
  }

  handleChange = (v) => {
    const params = this.props.location.state || {}
    if (params.billingStatus === 'FormerBackBill' || params.billingStatus === 'NoFormerBackBill') {
      if (tempaidIn < 0 && v > 0) {
        v = 0 - v;
      }
    }
    this.setState({
      receipts: v
    })
  }

  goback = () => {
    store.dispatch(goBack());
    store.dispatch(closePaymodal());
  }

  render () {
    // const params = this.props.location.state || {}
    // const { paymentType, paidIn, paymentId, storage_balance } = params
    // 应收
    // receivable
    const inputProps = {
      placeholder: ' ',
      type: 'money',
      onChange: this.handleChange,
      ref: moneyInput => { this.moneyInput = moneyInput },
      clear: true
    }

    // if (typeof this.state.receipts === 'undefined') {
    // inputProps.defaultValue = paidIn
    // } else {
    inputProps.value = this.state.receipts
    // }

    return (
      <div className='receipts-09'>
        <NavBar title='结算' onLeftClick={this.goback} />
        <div className='receipts-10'>
          <List>
            <div className='receipts-01'>实收金额{/* <span>{paidIn}</span> */}</div>
            <List.Item>
              <div className='receipts-11'><em>￥</em><InputItem {...inputProps} /></div>
            </List.Item>
          </List>
        </div>
      </div>
    )
  }
}
