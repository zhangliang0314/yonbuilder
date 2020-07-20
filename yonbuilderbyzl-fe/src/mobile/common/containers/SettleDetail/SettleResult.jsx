import React, {Component} from 'react';
import {Button, List } from 'antd-mobile';
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar'
import {connect} from 'react-redux';
import SvgIcon from '@mdf/metaui-web/lib/components/common/SvgIcon';
import {push} from 'react-router-redux';
import {bindActionCreators} from 'redux'
import {getFixedNumber} from 'src/common/redux/modules/billing/paymode'
import {getBusinessType} from 'src/common/redux/modules/billing/reserve'
import {ModifyBillStatus} from 'src/common/redux/modules/billing/uretailHeader'
import {store} from '../../../client/client'
import {setOptions} from 'src/common/reducers/modules/billing'
import {paymentIconDict} from './index'

let timey = null;

class SettleResult extends Component {
  constructor (props) {
    super(props)
  }

  componentDidMount () {
    timey = setTimeout(function () {
      this.goBack();
    }.bind(this), 3000);
  }

  goBack () {
    clearTimeout(timey);
    const params = this.props.location.state || {};
    if(params.billingStatus === 'Shipment' || params.billingStatus === 'PresellBill') {
      store.dispatch(setOptions({isAgainBilling: true}));
      this.props.historyPush({pathname: '/billing', state: 'newReserveBill'})
    }else{
      this.props.historyPush({pathname: '/billing', state: 'newBill'})
    }
  }

  componentWillMount () {
    const params = this.props.location.state || {};
    if(params.billingStatus === 'Shipment' || params.billingStatus === 'PresellBill' || params.billingStatus === 'PresellBack') {
      // let { reserveActions,uretailHeaderAction } = this.props;
      store.dispatch(getBusinessType(true, '', true));
      store.dispatch(ModifyBillStatus('PresellBill'));
    }
  }

  render () {
    const params = this.props.location.state || {}
    let {
      billingStatus,
      receivable, // 应收
      receipts, // 实收
      currentChange, // 找零
      paymodes, // 所有的支付方式
      vouchdate, // 订单时间
      code, // 订单号
      paytype // 类型
    } = params;
    receivable = getFixedNumber(receivable);
    receipts = getFixedNumber(receipts);
    return (
      <div className='receipts-02'>
        <NavBar
          onLeftClick={this.goBack.bind(this)}

          title='' />
        <div className='receipts-03'>
          <div className='receipts-04'>
            <div className='receipts-12'>

              {Number(currentChange) > 0 ? (
                /* 找零 */
                <div>
                  <List className='no-border'>
                    <List.Item>
                      <div className='receipts-05'>找零</div>
                      <h4>{currentChange}</h4>
                    </List.Item>
                  </List>
                  <div className='receipts-06'>
                    <p>
                      <span>{receivable}</span>应收金额
                    </p>
                    <p>
                      <span>{receipts}</span>实收金额
                    </p>
                  </div>
                </div>
              ) : (
                /**/
                <div className='receipts-13'>
                  <i className='receipt-sucess' />
                  <p>{(billingStatus === 'PresellBack' || billingStatus === 'FormerBackBill' || billingStatus === 'NoFormerBackBill') ? '退款成功' : '收款成功'}</p>
                  <h5>{receivable}</h5>
                </div>
              )}

              {/* 找零支付 */}
              {/* <List className="no-border">
                 {currentChange ? (<List.Item>
                    <div className="receipts-05">找零</div>
                    <h4>{currentChange}</h4>
                   </List.Item>) : null}
              </List>
              <div className="receipts-06">
                  <p>
                    <span>{receivable}</span>应收金额
                  </p>
                  <p>
                    <span>{receipts}</span>实收金额
                  </p>
              </div> */}
              {/* 微信支付 */}

            </div>
            <div className='receipts-07'>
              <p><span>订单号</span><em>{code}</em></p>
              <p><span>订单时间</span><em>{vouchdate}</em></p>
              <p>
                <span>{paytype === 'PresellBack' ? '退款明细' : '支付方式'}</span>
                {_.map(paymodes, item => {
                  return item.show && (<em key={item.paymentId}><SvgIcon type={paymentIconDict[item.paymentType + '']} />{item.name}
                    <i>{getFixedNumber(item.value)}</i>
                  </em>)
                })}
                {/*        <em>现金<SvgIcon type="xianjin"/></em>
                <br/>
                <em>储值卡支付<SvgIcon type="chuzhiqia"/></em> */}
              </p>
            </div>
            <div className='button-inline receipts-08'>
              <Button type='ghost' onClick={() => { clearTimeout(timey); this.props.historyPush('/') }}>返回首页</Button>
              <Button type='primary' onClick={this.goBack.bind(this)}>继续开单</Button>
              {/* <Button type="ghost">打印小票</Button> */}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

function mapDispatchToProps (dispatch) {
  return {
    historyPush: bindActionCreators(push, dispatch),
    dispatch
  }
}

export default connect(null, mapDispatchToProps)(SettleResult)
