import React, {Component} from 'react';
import _ from 'lodash'

export default class PaymodeInfo extends Component {
  constructor (props) {
    super(props)
  }

  componentDidMount () {

  }

  renderTabs (payments, currentPayment) {
    return <div>
      {_.map(payments, (item, k) => {
        return <span key={k} onClick={(e) => {
          this.props.onTabClick && this.props.onTabClick(e, item, k)
        }}>
          {item.name}
        </span>
      })}
    </div>
  }

  render () {
    const {payments, currentPayment} = this.props
    return (
      <div>
        <div>选择支付方式</div>
        <div>{this.renderTabs(payments, currentPayment)}</div>
        <div>仅储值卡支付两种支付方式，其他仅支持一种支付方式</div>
      </div>
    )
  }
}
