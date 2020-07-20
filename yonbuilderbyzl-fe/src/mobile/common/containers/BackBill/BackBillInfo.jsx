import React, { Component } from 'react'
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Icon, Checkbox, Button, InputItem } from 'antd-mobile'
import * as backBill from 'src/common/redux/modules/billing/backBill'
import { getFixedNumber, toggleCurrentPayment } from 'src/common/redux/modules/billing/paymode'
import * as billing from 'src/common/reducers/modules/billing'
import _ from 'lodash'
import './style.css'
// import nophoto from '@mdf/theme-mobile/theme/images/my-header.png'

const CheckboxItem = Checkbox.CheckboxItem;
let returnNums = [];
class BackBillInfo extends Component {
  constructor (props) {
    super(props);
    this.state = { retailItem: null, isAllCheck: false, chooseBills: [] };
  }

  componentDidMount () {
    returnNums = [];
    this.setState({ retailItem: this.props.retailItem });
    // this.setState({retailItem:this.props.location.state});
  }

    onInputChange = (type, value, item) => { }

    onBlur (type, value, item) {
      if (type === 'returnnum') {
        const refObj = this.refs['num' + item.id];
        let temValue = value;
        if (!value || value === '' || parseInt(value) === 0) {
          temValue = 1;
        }
        if (parseInt(value) > item.fQuantity) {
          temValue = item.fQuantity;
        }
        refObj.state.value = temValue;
        const returnNum = _.find(returnNums, function (o) {
          return o.id === item.id;
        });
        if (returnNum) {
          returnNum.num = temValue;
        } else {
          returnNums.push({ id: item.id, num: temValue });
        }
      }
    }

    getItems () {
      const { retailItem, chooseBills } = this.state;
      const itemViews = [];
      if (!retailItem || !retailItem.retailVouchDetailsArrary)
        return;
      let specs = '';
      retailItem.retailVouchDetailsArrary.map((item) => {
        specs = '';
        for (const attr in item) {
          if (attr.startsWith('free')) { specs += item[attr] + ' ' }
        }
        const index = _.findIndex(chooseBills, function (o) {
          return o.id === item.id;
        });
        itemViews.push(<div key={item.id} className='pro_contains_item_v' style={{ height: '2.1rem', display: 'flex' }}>
          {
            (Number(item.fCanCoQuantity) != 0) ? <CheckboxItem checked={index >= 0} onChange={(e) => this.onChecked('', item)} /> : <span className='am-checkbox-zw'><span className='select-no' /></span>
          }
          <div style={{ flex: '1', display: 'flex', flexFlow: 'row' }}>
            {(item.productAlbums && item.productAlbums.length > 0) ? <img src={item.productAlbums[0].murl} alt='图片' /> : <Icon type='icon-morentupiancopy' />}
            <div className='pro_item_v'>
              <span>{item.product_cName}</span>
              {
                cb.utils.isEmpty(specs) ? '' : <span>规格:{specs}</span>
              }
              <span className='money'>
                <div>
                  <i><em>￥</em>{getFixedNumber(item.fMoney)}</i>
                  <i style={{ display: (parseFloat(item.fMoney) === parseFloat(item.fQuoteMoney)) ? 'none' : 'block' }}><em>￥</em>{getFixedNumber(item.fQuoteMoney)}</i>
                </div>
                <span className='iEmployeeid_name'><i>营</i>{item.iEmployeeid_name}</span>
                <span className='product_info_num_cls' style={{ display: 'none' }}><InputItem readOnly={parseInt(item.fQuantity) > 1} ref={'num' + item.id} key={item.id} onBlur={(value) => this.onBlur('returnnum', value, item)} defaultValue={1}>可退</InputItem></span>
              </span>
              <span className='billing-product-num'><em>X</em>{item.fQuantity} </span>
            </div>
          </div>
        </div>);
      })
      return itemViews;
    }

    onChecked = (type, item) => {
      const { setProductSelectedKeys, setMainSelectedKey } = this.props.backBillAction;
      const { retailItem, isAllCheck, chooseBills } = this.state;
      if (type === 'all') {
        if (!retailItem || !retailItem.retailVouchDetailsArrary)
          return;
        let tempChooseBills = [];
        if (!isAllCheck) {
          setMainSelectedKey(retailItem.key);
          retailItem.retailVouchDetailsArrary.map((item) => {
            if (Number(item.fCanCoQuantity) != 0) {
              tempChooseBills.push(item);
            }
          })
        } else {
          setMainSelectedKey();
          tempChooseBills = [];
        }
        this.setState({ isAllCheck: !isAllCheck, chooseBills: tempChooseBills });
      } else {
        const index = _.findIndex(chooseBills, function (o) {
          return o.id === item.id;
        });
        const keyCode = item.iRetailid + '_' + item.id;
        if (index >= 0) {
          setProductSelectedKeys(keyCode, false);
          chooseBills.splice(index, 1);
        } else {
          setProductSelectedKeys(keyCode, true);
          chooseBills.push(item);
        }
        let tempIsAllCheck = false;
        let totalNum = retailItem.retailVouchDetailsArrary.length;
        retailItem.retailVouchDetailsArrary.map((item) => {
          if (Number(item.fCanCoQuantity) === 0) {
            totalNum = totalNum - 1;
          }
        })
        if (chooseBills.length === totalNum) {
          tempIsAllCheck = true;
        }
        this.setState({ isAllCheck: tempIsAllCheck, chooseBills: chooseBills });
      }
    }

    totalMoney () {
      const { chooseBills } = this.state;
      let money = 0;
      chooseBills.map((item) => {
        money = parseFloat(money) + parseFloat(item.fMoney);
      })
      return money;
    }

    componentWillUnmount () {
      const { backBillModalControl } = this.props.backBillAction;
      backBillModalControl('handleCancel');
    }

    goSettleBill () {
      const { backBillModalControl } = this.props.backBillAction;
      const { gatheringVouchDetail } = this.props.retailItem;
      if (gatheringVouchDetail.length > 0) {
        this.props.toggleCurrentPayment(gatheringVouchDetail[0].iPaymentid);
      }
      backBillModalControl('handleOk');
      // const { chooseBills } = this.state;
      // console.log(returnNums);
      // console.log(chooseBills);
    }

    getProductCount () {
      const { chooseBills } = this.state;
      let count = 0;
      chooseBills.map((item) => {
        count = parseInt(count) + parseInt(item.fCanCoQuantity);
      });
      return count;
    }

    render () {
      const { retailItem, isAllCheck } = this.state;
      // let itemView = this.getItems();
      return (
        <div className='kunge_info'>
          <NavBar onLeftClick={this.props.onBackBillBack()} title='选择退货商品' />
          <div className='kunge_info_count'>
            <div className='kunge_info_count_over'>
              <div className='info-member' style={{ display: ((!retailItem || !retailItem.memberName) ? 'none' : 'block') }}>
                {
                  (retailItem && !cb.utils.isEmpty(retailItem.avatar))
                    ? <img style={{ width: '0.8rem', height: '0.8rem', float: 'left', margin: '0.2rem' }} src={retailItem.avatar} />
                    : <div className='default-avatar' style={{float: 'left', width: '0.7rem', height: '0.7rem'}} />
                }
                <div className='info-member-name'> {retailItem && retailItem.memberName}</div>
                <ul className='info-member-jifen'>
                  <li><span>{retailItem && retailItem.fPointPay}</span></li>
                  <li>抵扣积分</li>
                </ul>
                <ul className='info-member-jifen'>
                  <li><span>{retailItem && retailItem.points}</span></li>
                  <li>本单积分</li>
                </ul>
              </div>
              <div className='kunge_info_list'>
                <div className='info-order-number' style={{ display: ((!retailItem || !retailItem.billsCode) ? 'none' : 'block') }}><span>{retailItem && retailItem.billsCode}</span></div>
                <div className='reserve-order-detail'>{this.getItems()}</div>
              </div>
            </div>
          </div>

          <div className='back_bill_settle_cls'>
            <div onClick={(e) => this.onChecked('all')} className='kunge123456'>
              <CheckboxItem checked={isAllCheck}>全选</CheckboxItem>
            </div>
            <Button onClick={() => { this.goSettleBill() }}>去结算</Button>
            <div className='back_bill_Settlement'>
              <div className='all-money'>总计<span>{getFixedNumber(this.totalMoney()) < 0 ? '-' : ''}<i>￥</i>{getFixedNumber(this.totalMoney()) < 0 ? (0 - getFixedNumber(this.totalMoney())) : getFixedNumber(this.totalMoney())}</span></div>
              <div className='select-number'>已选<span>{this.getProductCount()}</span>件</div>
            </div>

          </div>
        </div>
      )
    }
}

function mapStateToProps (state) {
  return {
    backBill: state.backBill.toJS(),
    state
  }
}

function mapDispatchToProps (dispatch) {
  return {
    backBillAction: bindActionCreators(backBill, dispatch),
    billingAction: bindActionCreators(billing, dispatch),
    toggleCurrentPayment: bindActionCreators(toggleCurrentPayment, dispatch),
    dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(BackBillInfo)
