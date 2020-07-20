import React, { Component } from 'react';
import { Button } from 'antd-mobile';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { push } from 'react-router-redux'
import { getFixedNumber, gotoSettleDetail, setDepositMoney } from 'src/common/redux/modules/billing/paymode'
import * as reserveActions from 'src/common/redux/modules/billing/reserve'
class SettleInfoBar extends Component {
  constructor (props) {
    super(props)
  }

  render () {
    const { products, money } = this.props.product.toJS()
    const { billingStatus } = this.props.uretailHeader.toJS()
    const productsIsEmpty = _.isEmpty(products)
    const { paymodes } = this.props.paymode;
    const { MinPercentGiveMoneyPre } = this.props.reserve
    this.total = getFixedNumber(money.Total.value)
    // 应收
    this.receivable = getFixedNumber(money.Gathering.value)
    // 实收
    this.receipts = getFixedNumber(_.sumBy(paymodes, o => {
      return isNaN(o.value) ? 0 : Number(o.value)
    }))
    let receivableControl;
    if(this.receivable < 0) {
      receivableControl = <span className='billing-Total-money'><span>-¥</span>{getFixedNumber(Math.abs(this.receivable))}</span>
    }else{
      receivableControl = <span className='billing-Total-money'><span>¥</span>{getFixedNumber(this.receivable)}</span>
    }
    return (
      <div className='billing-bottom-btn'>

        {
          billingStatus === 'CashSale' || billingStatus === 'NoFormerBackBill' || billingStatus === 'FormerBackBill' ? (
            <div className='billing-bottom-rt'>
              <div>
                {/*  交货状态下显示'已收款' */}
                {billingStatus === 'Shipment' && <div className='clearfix billing-touch-receivables'><span>已收款</span><span
                  className='fr'>{getFixedNumber(money.Deposit.value)}</span></div>}
              </div>
              <div className='billing-Total'>
                <span>总计</span>
                {receivableControl}
              </div>

              <div className='billing-Total-number'>
                共<span>{money.TotalQuantity.value.toFixed(cb.rest.AppContext.option.quantitydecimal)}</span>件
              </div>
            </div>
          ) : (
            <div className='billing-bottom-rt reverse-buttom-btn'>
              <div className='billing-Total dj-money' style={{ display: (billingStatus === 'Shipment' ? 'block' : 'none') }}>
                <span>订金金额</span><span className='billing-Total-money'>{parseFloat(money.Deposit.value) === 0 ? (MinPercentGiveMoneyPre === 0 ? getFixedNumber(money.Deposit.value) : this.receivable) : getFixedNumber(money.Deposit.value)}</span>
              </div>
              <div className={'billing-Total sk-money ' + (billingStatus === 'Shipment' ? '' : 'none-sk-money')}>
                <span className='gong-count'>
                  共<span>{money.TotalQuantity.value.toFixed(2)}</span>件
                </span>
                <span>
                  <span>未收金额</span>
                  <span className='billing-Total-money'><span>¥</span>{this.receivable}</span>
                </span>
              </div>

            </div>
          )
        }

        <div className='billing-Settlement-btn'>
          <Button className='Settlement-btn'
            disabled={productsIsEmpty}
            onClick={() => {
              if (billingStatus === 'PresellBill') {
                this.props.setDepositMoney(this.receivable);
              }
              this.props.reserveActions.setReserveIsEdit({ isEdited: false });
              !productsIsEmpty && this.props.dispatch(gotoSettleDetail())
            }}>去结算</Button>
        </div>

      </div>

    )
  }
}

function mapStateToProps (state) {
  return {
    user: state.user,
    paymode: state.paymode,
    money: state.money,
    product: state.product,
    reserve: state.reserve,
    uretailHeader: state.uretailHeader,
    member: state.member
  };
}

function mapDispatchToProps (dispatch) {
  return {
    // actions: bindActionCreators(UserActions, dispatch),
    dispatch,
    historyPush: bindActionCreators(push, dispatch),
    reserveActions: bindActionCreators(reserveActions, dispatch),
    setDepositMoney: bindActionCreators(setDepositMoney, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SettleInfoBar)
