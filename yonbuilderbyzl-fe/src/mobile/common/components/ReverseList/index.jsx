import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import PropTypes from 'prop-types';
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import * as unsubscribeActions from 'src/common/redux/modules/billing/unsubscribe'
import * as uretailHeaderActions from 'src/common/redux/modules/billing/uretailHeader'
import * as reserveActions from 'src/common/redux/modules/billing/reserve'
import * as billingActions from '../../reducers/modules/billing'
import { clear, save } from 'src/common/redux/modules/billing/mix'
import { setOriginalPaymodes, getFixedNumber } from 'src/common/redux/modules/billing/paymode'
import { Icon, Modal, ListView, PullToRefresh } from '@mdf/baseui-mobile';
import './style.css'
import { genAction } from '@mdf/cube/lib/helpers/util'

class ReverseList extends Component {
  constructor (props) {
    super(props);
    this.listViewDataSource = new ListView.DataSource({
      rowHasChanged: (row1, row2) => row1 !== row2,
    });
    this.dataIndex = [];
    this.state = {
      dataSource: this.listViewDataSource.cloneWithRows(this.dataIndex)
    }
  }

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  componentWillReceiveProps (nextProps) {
    this.dataIndex = [];
    const nextDataSource = nextProps.data;
    this.initListData(nextDataSource);
    return true;
  }

  componentDidMount () {
    this.props.init(this.lv);
  }

  /* 初始化ListView 需要dataSource */
  initListData = (data) => {
    if (!data)
      data = this.props.data;
    if (!data)
      return;
    data.data.map((item, index) => {
      this.dataIndex.push(item);
    });
    this.setState({
      dataSource: this.listViewDataSource.cloneWithRows(this.dataIndex)
    })
  }

  handClick (obj, eventType) {
    const iDeliveryState = obj.rm_retailvouch.iDeliveryState;
    if (iDeliveryState === 0) {
      this.props.clear();
      const { setMainSelectedKey, unsubscribeModalControl } = this.props.unsubscribeActions;
      if (eventType === 0) {
        setMainSelectedKey(obj.rm_retailvouch.id);
        unsubscribeModalControl('handleOk', 'Shipment');
        this.props.dispatch(push({ pathname: '/billing' }));
      } else if (eventType === 1) {
        Modal.alert(<div className='icon_wenhao' />, '确定要退订吗?', [
          { text: '取消', onPress: () => console.log('cancel') },
          {
            text: '确定', onPress: function () {
              setMainSelectedKey(obj.rm_retailvouch.id);
              unsubscribeModalControl('handleOk', 'PresellBack');
              this.props.setOriginalPaymodes(obj.rm_gatheringvouch.gatheringVouchDetail);
              this.props.save(function (data) {
                // const { paymodes } = this.props.paymode;
                const receivable = obj.rm_retailvouch.fGatheringMoney;
                const receipts = obj.rm_retailvouch.fMoneySum;
                const paymodes = obj.rm_gatheringvouch.gatheringVouchDetail;
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
                localStorage.setItem('billing_lastBill', JSON.stringify(lastBill))
                this.props.dispatch(push('/settleResult', lastBill))
              }.bind(this), function (result) {
                cb.utils.Toast('退款失败!!' + result, 'error');
              })
            }.bind(this)
          },
        ])
      }
    } else if (eventType === 1) {

    }
  }

  itemClick (obj) {
    const { onOpenDetail } = this.props;
    if(!obj || !obj.rm_retailvouch || !obj.rm_retailvouch.retailVouchDetails) {
      cb.utils.alert('数据错误,请检查！', 'error');
      return
    }
    onOpenDetail(obj);
  }

  renderList (obj, sectionID, rowID) {
    const i = parseInt(rowID);
    const { type } = this.props;
    let countQuantity = 0;
    /** * iPresellState 预订单状态 0 非预订 1 预订 2 退订 3 交货 iDeliveryState 交货状态 0 未交 1 已交  2 退货  iPayState 收款状态 0 未收款 1 全款结清 2 收部分 iTakeway 提货方式 0 即提 1 本店自提 2 中心配送***/
    const iDeliveryState = obj.rm_retailvouch.iDeliveryState;
    const retailVouchDetails = obj.rm_retailvouch.retailVouchDetails || [];
    const retailVouchDetailsLength = retailVouchDetails ? parseInt(retailVouchDetails.length) : 0;
    // let tempGathering = getFixedNumber(obj.rm_retailvouch.fQuoteMoneySum - obj.rm_retailvouch.fPresellPayMoney - obj.rm_retailvouch.fSceneDiscountSum) - obj.rm_retailvouch.fDiscountSum;
    // tempGathering = tempGathering < 0 ? 0 : tempGathering;
    let specs = '';
    if (retailVouchDetailsLength > 0)
      for (const attr in retailVouchDetails[0]) {
        if (attr.startsWith('free')) { specs += retailVouchDetails[0][attr] + ' ' }
      }
    return (
      <div className='reserve_list_item_c' style={{ borderTopWidth: i === 0 ? '0' : '5' }} key={obj.rm_retailvouch.code}>
        <div onClick={this.itemClick.bind(this, obj)}>
          <div className='reserve_list_bar_01'><span>{obj.rm_retailvouch.code}</span><span style={{ display: 'none' }} className='status_tab'>{iDeliveryState === 0 ? '未交货' : (iDeliveryState === 1 ? '已交货' : '已退订')}</span></div>
          {
            !cb.utils.isEmpty(obj.rm_retailvouch.cCusperson) ? (
              <div className='user'><span><em>联系人：</em>{obj.rm_retailvouch.cCusperson} </span><span><em>电话：</em>{obj.rm_retailvouch.cMobileNo}</span></div>
            ) : ''
          }
          <div className='reserve_list_bar_02'>
            <div className='reserve_pros_item'>
              <div className='pro_tab' style={{ width: this.props.width }}>
                {
                  retailVouchDetails.length === 1 ? (
                    <div key={retailVouchDetails[0].id} className='single_product_item_v pro_contains_item_v'>
                      <div className='pro_item_c'>
                        {(retailVouchDetails[0].productAlbums && retailVouchDetails[0].productAlbums.length > 0) ? <img src={retailVouchDetails[0].productAlbums[0].murl} alt='图片' /> : <Icon type='icon-morentupiancopy' />}
                      </div>
                      <div className='pro_item_v'>
                        <span className='title'>{retailVouchDetails[0].product_cName}</span>
                        {
                          cb.utils.isEmpty(specs) ? '' : (
                            <span className='rule'>规格:{specs}</span>
                          )
                        }
                        <span className='billing-product-num'><em>X</em>{retailVouchDetails[0].fQuantity} </span>
                      </div>

                    </div>
                  ) : (
                    <div className='scroll' style={{ width: (retailVouchDetailsLength * 1.6) + 'rem' }}>{
                      retailVouchDetails.map((item) => {
                        countQuantity = parseInt(item.fQuantity) + countQuantity;
                        return (
                          <div key={item.id} className='pro_item_c'>{(item.productAlbums && item.productAlbums.length > 0) ? <img src={item.productAlbums[0].murl} alt='图片' /> : <Icon type='icon-morentupiancopy' />}<span style={{ display: (parseInt(item.fQuantity) > 1 ? 'block' : 'none') }}>{parseInt(item.fQuantity) > 99 ? '99+' : (item.fQuantity + '')}</span></div>
                        )
                      })
                    }
                    </div>
                  )
                }
              </div>
              {
                retailVouchDetails.length === 1 ? '' : (
                  <span className='pro_total'>共{countQuantity}件<i className='icon icon-jiantou' /></span>
                )
              }
            </div>

          </div>
        </div>
        <div className='reserve_list_bar_04'>
          <span>应收金额: <i>￥{getFixedNumber(obj.rm_retailvouch.fMoneySum - obj.rm_retailvouch.fPresellPayMoney || 0)}</i></span>
          <span className='hide'>已收款: <i>￥{obj.rm_retailvouch.fPresellPayMoney}</i></span>
          <span className='btn_tab'>{type === 'Shipment' ? (<span><button onClick={this.handClick.bind(this, obj, 1)}>退订</button><button className='jh' onClick={this.handClick.bind(this, obj, 0)}>交货</button></span>) : (type === 'PresellBack' ? '' : '')}</span>
        </div>
      </div>
    )
  }

  /* 上拉加载 */
  onEndReached = (event) => {
    this.props.loadMore();
  }

  /* 下拉刷新 */
  onRefresh = () => {
    this.props.refreshList();
  }

  renderSeparator = (sectionID, rowID) => (
    <div
      key={rowID}
      style={{
        backgroundColor: '#F5F5F9',
        height: 8,
        borderTop: '1px solid #ECECED',
        borderBottom: '1px solid #ECECED',
      }}
    />
  )

  renderFooter = () => {
    const { isLoading, data } = this.props;
    let content = '';
    if (isLoading) {
      content = '加载中...';
    } else {
      content = '上拉加载更多';
    }
    if (data) {
      if (data.totalCount == 0) {
        content = <div className='list-noData' />
      } else if (data.totalCount <= this.dataIndex.length) {
        content = '没有更多了~'
      } else if (data.totalCount === this.dataIndex.length) {
        content = '上拉加载更多...';
      }
    }
    return (
      <div style={{ padding: 15, textAlign: 'center' }}>
        {content}
      </div>
    )
  }

  render () {
    // let { isLoading, data } = this.props;
    return (
      <ListView
        ref={el => { this.lv = el }}
        key='listview'
        renderFooter={this.renderFooter}
        renderSeparator={this.renderSeparator}
        dataSource={this.state.dataSource}
        useBodyScroll={false}
        style={{ height: (this.props.height) }}
        renderRow={this.renderList.bind(this)}
        scrollRenderAheadDistance={500}
        scrollEventThrottle={1000}
        onEndReachedThreshold={100}
        onScroll={(e) => { this.props.onScroll(e) }}
        pullToRefresh={<PullToRefresh
          refreshing={this.props.refreshing}
          onRefresh={this.onRefresh}
        />}
        onEndReached={this.onEndReached}
        pageSize={8} />
    )
  }
}

function mapStateToProps (state) {
  return {
    paymode: state.paymode.toJS()
  }
}

function mapDispatchToProps (dispatch) {
  return {
    reserveActions: bindActionCreators(reserveActions, dispatch),
    billingActions: bindActionCreators(billingActions, dispatch),
    unsubscribeActions: bindActionCreators(unsubscribeActions, dispatch),
    uretailHeaderActions: bindActionCreators(uretailHeaderActions, dispatch),
    setOriginalPaymodes: bindActionCreators(setOriginalPaymodes, dispatch),
    save: bindActionCreators(save, dispatch),
    clear: bindActionCreators(clear, dispatch),
    dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReverseList)
