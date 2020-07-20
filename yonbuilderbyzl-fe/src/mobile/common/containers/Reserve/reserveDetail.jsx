import React, { Component } from 'react'
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { bindActionCreators } from 'redux';
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar';
import * as reserveActions from 'src/common/redux/modules/billing/reserve'
import * as uretailHeaderActions from 'src/common/redux/modules/billing/uretailHeader'
import { List, Modal } from 'antd-mobile';
import * as unsubscribeActions from 'src/common/redux/modules/billing/unsubscribe'
import ProductList from '../../components/ProductList'
import { clear, save } from 'src/common/redux/modules/billing/mix'
import { setOriginalPaymodes, getFixedNumber } from 'src/common/redux/modules/billing/paymode'
import { genAction } from '@mdf/cube/lib/helpers/util'
// import nophoto from '@mdf/theme-mobile/theme/images/my-header.png'
const Item = List.Item;

class ReserveDetail extends Component {
  constructor (props) {
    super(props);
    this.state = { reserve: {} }
  }

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  componentWillMount () {
    const detail = this.props.data;// .location.state;
    if (cb.utils.isEmpty(this.state.reserve.code)) {
      this.setState({ reserve: detail.rm_retailvouch });
    }
    this.props.reserveActions.reserveDetail({ id: detail.rm_retailvouch.id }, function (issuccess, data) {
      if (issuccess) {
        this.setState({ reserve: data });
      }
    }.bind(this));
  }

  componentWillUnmount () {
    // this.props.reserveActions.getStoreInfo();
    // this.props.reserveActions.getBusinessType(true,"",true);
  }

  transationDetail () {
    const { reserve } = this.state;
    const detail = this.props.data;// .location.state;
    const iDeliveryState = detail.rm_retailvouch.iDeliveryState;
    let detailView = '';
    // let tempGathering = getFixedNumber(reserve.fQuoteMoneySum - reserve.fPresellPayMoney - reserve.fSceneDiscountSum - reserve.fDiscountSum);
    // tempGathering = tempGathering < 0 ? 0 : tempGathering;
    if (iDeliveryState === 0) {
      detailView = (
        <List className='my-list yuding-list'>
          <Item extra={'￥' + (getFixedNumber(reserve.fQuoteMoneySum || 0))}>商品金额</Item>
          {/* <Item extra={'￥'+(reserve.fVIPDiscountSum || 0)}>会员优惠</Item> */}
          <Item className='color-red' extra={'￥' + (getFixedNumber(reserve.fQuoteMoneySum - reserve.fMoneySum))}>促销优惠</Item>
          <Item extra={'￥' + (getFixedNumber(reserve.fMoneySum || 0))}>应收金额</Item>
          <Item extra={'￥' + (getFixedNumber(reserve.fPresellPayMoney || 0))}>订金金额</Item>
          <Item className='unreceivable color-red' extra={'￥' + getFixedNumber(reserve.fMoneySum - reserve.fPresellPayMoney || 0)}>未收金额</Item>
        </List>
      );
    } else {
      detailView = (
        <List className='my-list yuding-list'>
          <Item extra={'￥' + (getFixedNumber(reserve.fQuoteMoneySum || 0))}>商品金额</Item>
          <Item extra={'￥' + (getFixedNumber(reserve.fPresellPayMoney || 0))}>已收款金额（定金）</Item>
          <Item extra={'￥' + (getFixedNumber(reserve.fPresellPayMoney || 0))}>收款总额</Item>
        </List>
      );
    }
    return detailView;
  }

  // handClick(billingStatus){
  //     let { reserve } = this.state;
  //     let iDeliveryState = reserve.iDeliveryState;
  //     if(iDeliveryState===0){
  //         this.props.clear();
  //         let { setMainSelectedKey,unsubscribeModalControl } = this.props.unsubscribeActions;
  //         setMainSelectedKey(reserve.id);
  //         unsubscribeModalControl('handleOk',billingStatus);
  //         // this.props.billingActions.setOptions({navBarState:'reserve'});
  //         this.props.dispatch(push({pathname:'/billing',state:'reserve'}));
  //         // if(obj.bDeliveryModify){
  //         //     let { setMainSelectedKey } = this.props.unsubscribeActions;
  //         //     setMainSelectedKey(obj.rm_retailvouch.id);
  //         //     //交货可改
  //         // }else{
  //         //     //交货不可改
  //         // }
  //     }else if(eventType===1){

  //     }
  // }

  handClick (obj, eventType) {
    const iDeliveryState = obj.iDeliveryState;
    if (iDeliveryState === 0) {
      this.props.clear();
      const { setMainSelectedKey, unsubscribeModalControl } = this.props.unsubscribeActions;
      if (eventType === 0) {
        setMainSelectedKey(obj.id);
        unsubscribeModalControl('handleOk', 'Shipment');
        this.props.dispatch(push({ pathname: '/billing' }));
      } else if (eventType === 1) {
        Modal.alert(<div className='icon_wenhao' />, '确定要退订吗?', [
          { text: '取消', onPress: () => console.log('cancel') },
          {
            text: '确定', onPress: function () {
              setMainSelectedKey(obj.id);
              unsubscribeModalControl('handleOk', 'PresellBack');
              this.props.setOriginalPaymodes(obj.retailVouchGatherings);
              this.props.save(function (data) {
                // const { paymodes } = this.props.paymode;
                const receivable = obj.fGatheringMoney;
                const receipts = obj.fMoneySum;
                const paymodes = obj.retailVouchGatherings;
                paymodes.map((paymodeObj) => {
                  paymodeObj.show = true;
                  paymodeObj.paymentId = paymodeObj.iPaymentid;
                  paymodeObj.paymentType = paymodeObj.iPaytype;
                  paymodeObj.name = paymodeObj.iPaymentid_name;
                  paymodeObj.value = paymodeObj.fMoney;
                });
                const currentChange = 0;
                let _temVoucher = data;
                if (!_temVoucher.code && !_temVoucher.vouchdate) {
                  _temVoucher = JSON.parse(data).rm_retailvouch[0];
                }
                const lastBill = _.assign({}, _.pick(_temVoucher,
                  [
                    'vouchdate', // 订单时间
                    'code', // 订单号
                    'billingStatus'
                  ]
                ), {
                  receivable: 0 - receivable, // 应收
                  receipts, // 实收
                  currentChange, // 找零
                  paymodes, // 所有的支付方式
                  paytype: 'PresellBack' // 退订
                })
                // 存放完成的订单
                this.props.dispatch(genAction('PLATFORM_UI_BILLING_DATASOURCE_REMOVE_CODE', _temVoucher.code));
                localStorage.setItem('billing_lastBill', JSON.stringify(lastBill));
                this.props.dispatch(push('/settleResult', lastBill))
              }.bind(this), function (result) {
                cb.utils.Toast('退款失败!!', 'error');
              })
            }.bind(this)
          },
        ])
      }
    } else if (eventType === 1) {

    }
  }

  renderFooter (obj) {
    const { uretailHeaderActions } = this.props;
    // let detail = this.props.data;//.location.state;
    // let iDeliveryState = detail.rm_retailvouch.iDeliveryState;
    let detailView = '';
    if (obj.iDeliveryState === 0) {
      detailView = (
        <div className='footer'>
          <button className='jh' onClick={this.handClick.bind(this, obj, 0)}>交货</button>
          <button onClick={this.handClick.bind(this, obj, 1)}>退订</button>
          <button onClick={() => { cb.utils.Toast('正在开发中...', 'warning') }}>重打小票</button></div>
      );
    } else {
      detailView = (
        <div className='footer'>
          <button onClick={() => { uretailHeaderActions.getRelating(obj.id) }}>联查原单</button>
          <button onClick={() => { cb.utils.Toast('正在开发中...', 'warning') }}>重打小票</button>
        </div>
      );
    }
    return detailView;
  }

  payModeControll (retailVouchGatherings) {
    const controll = [];
    if (retailVouchGatherings) {
      const tempArr = [];
      retailVouchGatherings.map((obj) => {
        const tempIndex = tempArr.findIndex((tobj) => { if (tobj.iPaytype === obj.iPaytype) { return tobj; } });
        if (tempIndex >= 0) {
          obj.fMoney = tempArr[tempIndex].fMoney + obj.fMoney;
          tempArr.splice(tempIndex, 1);
        }
        tempArr.push(obj);
      });
      // console.log(tempArr);
      tempArr.map((gathering) => {
        controll.push(<div key={gathering.iPaymentid}><span>{gathering.iPaymentid_name}</span><span>{getFixedNumber(gathering.fMoney)}</span></div>);
      })
    }
    return controll;
  }

  getDefinedControls=() => {
    const { reserve } = this.state;
    const dataSource = this.props.sreserve.define_DataSource;
    const controls = [];
    dataSource.forEach((ele, i) => {
      if(reserve[ele.dataIndex])
        controls.push(<Item extra={reserve[ele.dataIndex]}>{ele.metaData.cCaption}</Item>);
    })
    return controls;
  }

  /** * iPresellState 预订单状态 0 非预订 1 预订 2 退订 3 交货 iDeliveryState 交货状态 0 未交 1 已交  2 退货  iPayState 收款状态 0 未收款 1 全款结清 2 收部分 iTakeway 提货方式 0 即提 1 本店自提 2 中心配送***/
  render () {
    const { reserve } = this.state;
    if (reserve === {}) {
      return;
    }
    const iDeliveryState = reserve.iDeliveryState;
    return (
      <div className='reserve-order-detail'>
        <NavBar onLeftClick={() => { this.props.onOpenDetail(null) }} title={iDeliveryState === 0 ? '预订单详情' : '预订单详情'} />
        {iDeliveryState === 0 ? (
          <div className='no-delivery'><p><i className='icon icon-tongzhixinxi' />未交货</p></div>
        ) : (iDeliveryState === 1 ? (
          <div className='already-delivery'><p><i className='icon icon-chenggongtishi' />已交货</p></div>
        ) : (
          <div className='return'><p><i className='icon icon-cuowutishi' />已退订</p></div>
        ))}

        <div className='detail_tab_bar_v detail_tab_ba_status'>

          {(reserve.iMemberid !== 0) ? (<div className='message'><div>
            {
              !cb.utils.isEmpty(reserve.avatar) ? <img style={{ width: '0.7rem', height: '0.7rem', float: 'left', margin: '0.2rem' }} src={reserve.avatar} /> : <div className='default-avatar' style={{float: 'left', width: '0.7rem', height: '0.7rem'}} />
            }<span>{reserve.iMemberid_name}</span></div></div>
          ) : ''}

        </div>

        <div className={!cb.utils.isEmpty(reserve.cCusperson) ? 'top-detail' : 'top-detail'}>
          <div className='detail_tab_bar_v order-code'>
            <div className='info-order-number'><span>{reserve.code}</span></div>
            {/* <span>{reserve.code}</span> */}
            <span className='hide' style={{ float: 'right' }}>{iDeliveryState === 0 ? '未交货' : (iDeliveryState === 1 ? '已交货' : '退货')}</span></div>
          <ProductList data={reserve.retailVouchDetails} />
        </div>
        <div>
          {
            this.transationDetail()
          }
        </div>
        <List className='my-list detailed-list'>
          <Item extra={this.payModeControll(reserve.retailVouchGatherings)}>支付方式</Item>
          <Item extra={reserve.dMakeDate}>制单时间</Item>
          <Item className='border-t' extra={reserve.iMaker_name}>收银员</Item>
          {
            cb.utils.isEmpty(reserve.iBusinesstypeid_name) ? '' : (
              <Item extra={reserve.iBusinesstypeid_name}>业务类型</Item>
            )
          }
          {
            cb.utils.isEmpty(reserve.iTakeway + '') ? '' : (
              <Item extra={reserve.iTakeway === 1 ? '本店自提' : (reserve.iTakeway === 2 ? '本店配送' : '中心配送')}>提货方式</Item>
            )
          }
          {
            cb.utils.isEmpty(reserve.dPlanShipmentDate) ? '' : (
              <Item extra={reserve.dPlanShipmentDate}>希望交货日期</Item>
            )
          }
          {
            cb.utils.isEmpty(reserve.cCusperson) ? '' : (
              <Item extra={reserve.cCusperson}>联系人</Item>
            )
          }
          {
            cb.utils.isEmpty(reserve.cMobileNo) ? '' : (
              <Item extra={reserve.cMobileNo}>联系电话</Item>
            )
          }
          {
            cb.utils.isEmpty(reserve.cDeliveradd) ? '' : (
              <Item extra={(cb.utils.isEmpty(reserve.addressCascader) ? '' : reserve.addressCascader.name) + reserve.cDeliveradd}>收货地址</Item>
            )
          }
          {

            (reserve.iTakeway === 1 || reserve.iTakeway === 2) ? '' : (cb.utils.isEmpty(reserve.iDeliveryWarehouseid_name) ? '' : (
              <Item extra={reserve.iDeliveryWarehouseid_name}>交货仓库</Item>)
            )
          }
          {
            this.getDefinedControls()
          }
          {
            cb.utils.isEmpty(reserve.memo) ? '' : (
              <Item extra={reserve.memo}>备注</Item>
            )
          }
        </List>
        {
          this.renderFooter(reserve)
        }
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    reserve: state.orderReserve.toJS(),
    sreserve: state.reserve.toJS(),
    user: state.user.toJS()
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setOriginalPaymodes: bindActionCreators(setOriginalPaymodes, dispatch),
    reserveActions: bindActionCreators(reserveActions, dispatch),
    unsubscribeActions: bindActionCreators(unsubscribeActions, dispatch),
    save: bindActionCreators(save, dispatch),
    clear: bindActionCreators(clear, dispatch),
    uretailHeaderActions: bindActionCreators(uretailHeaderActions, dispatch),
    dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReserveDetail);
