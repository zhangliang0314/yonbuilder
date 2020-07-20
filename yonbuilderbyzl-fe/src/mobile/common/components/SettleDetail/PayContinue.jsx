import React, {Component} from 'react';
// import PropTypes from 'prop-types'
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar'
import {Button, Checkbox } from '@mdf/baseui-mobile';
import {connect} from 'react-redux';
import _ from 'lodash'
import {
  getFixedNumber,
  handleSettlePayment
} from 'src/common/redux/modules/billing/paymode'
import {paymentIconDict} from 'src/common/containers/SettleDetail'
import SvgIcon from '@mdf/metaui-web/lib/components/common/SvgIcon';

class PayContinue extends Component {
  constructor (props, context) {
    super(props, context)
    this.state = {
      continuePay: '-1'
    }
  }

  componentDidMount () {
    console.log(this.store)
  }

  renderTabs (payments, continuePay) {
    return <ul>
      {_.map(payments, (item, k) => {
        return <li key={k} onClick={(e) => {
          this.setState({
            continuePay: item.paymethodId
          })
        }}>
          <SvgIcon type={paymentIconDict[item.paymentType + '']} />
          <span>{item.name}</span>
          <Checkbox checked={continuePay == item.paymethodId} />
        </li>
      })}
    </ul>
  }

  render () {
    const {continuePay} = this.state
    const params = this.props.location.state || {}
    const {paidIn, storage_balance} = params
    const remaining = getFixedNumber(Number(paidIn) - Number(storage_balance))
    const payments = this.props.payments.toJS()
    return (
      <div className='receipts-02'>
        <NavBar title='请继续支付' />
        <div className='receipts-03'>
          <div className='receipts-04'>
            <div className='receipts-05'>
              <p>请支付剩余</p>
              <h4>{remaining}</h4>
            </div>
            <div className='receipts-15'>{this.renderTabs(_.filter(payments, item => {
              return item.paymentType != 5
            }), continuePay)}</div>
            <div className='receipts-14'>
              <Button type='primary'
                disabled={continuePay === '-1'}
                onClick={() => {
                  continuePay !== '-1' && this.props.dispatch(handleSettlePayment({
                    paymentId: continuePay,
                    isStorageUsed: true,
                    paymentType: payments[continuePay].paymentType,
                    paidIn: remaining,
                    storage_balance
                  }))
                }}
              >确认结算</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    payments: state.paymode.get('payment')
  }
}

function mapDispatchToProps (dispatch) {
  return {
    dispatch,
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PayContinue)
