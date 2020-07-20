import React, { Component } from 'react';
import { Button, Checkbox, Modal, List, InputItem, Switch, Picker, Icon } from 'antd-mobile';
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar'
import { connect } from 'react-redux';
import styles from './index.css';
import { bindActionCreators } from 'redux'
import { push, goBack } from 'react-router-redux'
import * as paymodeActions from 'src/common/redux/modules/billing/paymode'
import { getFixedNumber, getDelZeroResult, handleSettlePayment, updatePaymodesDuetoBack } from 'src/common/redux/modules/billing/paymode'
import { rollBackPromotion } from 'src/common/redux/modules/billing/ExecutPromotion'
import classnames from 'classnames'
import SvgIcon from '@mdf/metaui-web/lib/components/common/SvgIcon'
import Operator from '../Operator';
import { getPoint, usePonit, rollBackPoint } from 'src/common/reducers/modules/point';
import { handleOk, showModal, handleCancel } from 'src/common/redux/modules/billing/actions';
import { setData, cancelDiscount } from 'src/common/redux/modules/billing/discount';
import { executeAction } from 'src/common/redux/modules/billing/config';
import { rollBackCoupon } from 'src/common/reducers/modules/coupon';
import { ProductsDisplay } from './ProductsDetail'
import _ from 'lodash'
import * as reserveActions from 'src/common/redux/modules/billing/reserve'
import ProductList from 'src/common/containers/ProductList'
import { validateSettle } from '../../components/SettleCommon';
import { genAction } from '@mdf/cube/lib/helpers/util';
import CusRefer from 'src/common/components/refer/CusRefer';

export const paymentIconDict = {
  1: 'xianjin',
  2: 'yinhangqia',
  3: 'zhifubao',
  4: 'weixin',
  5: 'chuzhiqia',
  6: 'changjiezhifu',
  7: 'changjiezhifu',
  8: 'changjiezhifu',
  10: 'shouqianba',
  11: 'shandezhifu'
  // '6': 'xianjin',
}

let isResetReceive = false;
let tempAllReceivable = '0';
let isusePoint = false;
let recordDiscount = [];
let isResetPay = false;
class SettleDetail extends Component {
  constructor (props) {
    super(props)
    this.state = { deposit: 0.0, receivable: 0.0, isChooseBussiness: false, modifyreceivablestatus: false, discount: '100.00', sceneDiscount: '0.00' };
    this.validateSettle = validateSettle.bind(this)
    // 设置状态栏字体黑色
    cb.utils.setStatusBarStyle('dark');
  }

  componentDidMount () {
    const { member, uretailHeader, product } = this.props;
    const bHasMember = member.bHasMember;
    const { money } = product.toJS();
    // const { Businesstype_DataSource, isEdited } = this.props.reserve;
    const deposit = getFixedNumber(money.Deposit.value);
    // if (parseFloat(money.Deposit.value) === 0 && !isEdited) {
    //     deposit = getFixedNumber(money.Gathering.value);
    // }
    const gatheringVal = getFixedNumber(money.Gathering.value)
    // if(uretailHeader.toJS().billingStatus==='PresellBill'){
    //   if(gatheringVal<getFixedNumber(money.Real.value)){
    //     gatheringVal = getFixedNumber(money.Real.value);
    //   }
    //   this.props.paymodeActions.setPresellMoney(gatheringVal);
    // }
    tempAllReceivable = gatheringVal;
    this.setState({ receivable: gatheringVal, deposit: deposit });
    // 获取业务类型
    if (uretailHeader.billingStatus === 'CashSale') {
      // this.props.reserveActions.getDefaultBusinessType(1);
      this.props.reserveActions.showHeaderInfo();
    }

    if (bHasMember && !money.Point.done) { /* 存在会员  获取积分信息 */
      this.props.getPoint();
    }
    window.webViewEventHand.addEvent('SettleDetailBack', function (callback) {
      this.initModal(callback);
    }.bind(this));
  }

  closeDiscountPanel () {
    const { product } = this.props;
    // const bHasMember = member.bHasMember;
    const { money } = product.toJS();

    let deposit = getFixedNumber(money.Deposit.value);
    if (parseInt(money.Deposit.value) === 0) {
      deposit = getFixedNumber(money.Gathering.value);
    }
    this.setState({ receivable: getFixedNumber(money.Gathering.value), deposit: deposit, discount: '100.00', sceneDiscount: '0.00' });
  }

  componentWillMount () {

    // 已经执行促销的需要取消
    // this.props.dispatch(closePaymodal())

  }

  componentWillUnmount () {
    window.webViewEventHand.cancelEvent(null);
  }

  // 点击支付方式切换焦点
  onTabClick = (e, item, k) => {
    isResetPay = true;
    this.props.paymodeActions.toggleCurrentPayment(k)
  }

  /* add by jinzh1  获取一行几列显示 */
  getPayMentCols = (payment) => {
    let cols = 3;
    for (var key in payment) {
      if (payment[key].name && payment[key].name.length > 5) {
        cols = 2;
        break;
      }
    }
    return cols;
  }

  // 渲染支付方式
  renderTabs = (payment, currentPayment, storage_balance) => {
    const { billPaymodes } = this.props.paymode;
    const gatheringMoney = this.props.product.getIn(['money', 'Gathering', 'value']);
    let className = 'settle10';
    const cols = this.getPayMentCols(payment);
    if (cols == 2) className = 'settle10 col2';
    return <ul className={className}>
      {_.map(payment, (item, k) => {
        // 储值卡
        if (item.paymentType == 5) {
          // todo 余额为0时禁用
          return <li
            className={classnames({
              settleTypeActive: (!isResetPay && billPaymodes) ? billPaymodes[item.paymethodId].originValue : currentPayment == item.paymethodId,
              settleTypeDisabled: storage_balance == 0
            })}
            onClick={(e) => {
              storage_balance != 0 && this.onTabClick(e, item, k)
            }}
            key={k}>
            <SvgIcon type={paymentIconDict[item.paymentType + '']} />
            <Checkbox checked={(!isResetPay && billPaymodes) ? billPaymodes[item.paymethodId].originValue : currentPayment == item.paymethodId} />
            <span>{item.name}</span>
            <div className='badege'><em>{storage_balance}</em></div>
          </li>
        } else {
          /* let backBill_disable = billingStatus == 'FormerBackBill' ? ((billPaymodes && billPaymodes[item.paymethodId].originValue) ? false : true) : false */
          return <li
            className={classnames({
              settleTypeActive: (!isResetPay && billPaymodes && gatheringMoney < 0) ? billPaymodes[item.paymethodId].originValue : currentPayment == item.paymethodId,
              /* settleTypeDisabled: backBill_disable */
            })}
            key={k}
            onClick={(e) => {
              this.onTabClick(e, item, k)
            }}>
            <SvgIcon type={paymentIconDict[item.paymentType + '']} />
            <Checkbox checked={(!isResetPay && billPaymodes && gatheringMoney < 0) ? billPaymodes[item.paymethodId].originValue : currentPayment == item.paymethodId} />
            <span>{item.name}</span>
          </li>
        }
      })}
    </ul>
  }

  toggleDelZero = (checked) => {
    this.props.paymodeActions.toggleDelZero(checked)
  }

  // 抹零
  renderDelZero = (data) => {
    const { name, isEnable, isDefaultValue } = data
    if (!isEnable) return false
    return (

      <List>
        <List.Item>
          <div className='change-count'>
            <span className='change-number-title'>{name}</span>
            <span className='render-zero'>
              <Switch onChange={this.toggleDelZero} checked={isDefaultValue} />
            </span>
          </div>
        </List.Item>
      </List>

    )
  }

  /* 执行积分抵扣 */
  onPointChange = (checked) => {
    if (!checked) {
      const tempCheckNum = this.checkDiscount('point', false, true);
      if (tempCheckNum < 2) {
        if (tempCheckNum === 1) {
          console.log('已存在point,不是最后一个');
          return;
        } else {
          this.checkDiscount('point', true);
          console.log('已存在point,是最后一个');
        }
      }
    } else {
      this.checkDiscount('point');
      console.log('不存在point优惠');
    }
    const { billingStatus } = this.props.uretailHeader;
    isusePoint = checked;
    isResetReceive = true;
    const { money } = this.props.product.toJS();
    if (billingStatus === 'PresellBill') {
      this.props.paymodeActions.setDepositMoney('0');
    }
    this.setState({ receivable: getFixedNumber(money.Gathering.value) });
    this.props.usePonit(!checked);
  }

  // 检查优惠活动
  checkDiscount (type, isdelete, ischeck) {
    if (recordDiscount.indexOf(type) >= 0) {
      if (isdelete) {
        recordDiscount.splice(recordDiscount.indexOf(type), 1);
        return;
      }
      if (recordDiscount.indexOf(type) === (recordDiscount.length - 1)) {
        return 0;
      }
      console.log('存在此优惠...');
      return 1;
    }
    if (!ischeck) {
      recordDiscount.push(type);
    }
    return 2;
  }

  onSelect (eventType, reserveType, value) {
    if (eventType === 'ok') {
      if (reserveType === 'bussType') {
        const { infoData } = this.props.uretailHeader;
        const { Businesstype_DataSource } = this.props.reserve;
        const businesstypeObj = Businesstype_DataSource.find((busTypeObj) => {
          if (busTypeObj.id === value[0]) {
            return busTypeObj;
          }
        });
        infoData.businessType = { id: businesstypeObj.id, name: businesstypeObj.name };
        this.props.dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', { infoData: infoData }));
      }
    }
  }

  defaultReserveInfo () {
    const { isChooseBussiness } = this.state;
    const { uretailHeader, reserve } = this.props;
    const { billingStatus, infoData } = uretailHeader;
    const { businessType, takeWay, ReserveDeliveryDate, Businesstype_DataSource } = reserve;
    if (billingStatus === 'PresellBill' || billingStatus === 'Shipment') {
      return ( // billingStatus==='PresellBill'?this.props.dispatch(push('./editReserve')):''
        <List onClick={this.handEditReserve.bind(this, false)} className='my-list yd-list' style={{ backgroundColor: '#fff' }}>
          <List.Item className='store-list' extra={billingStatus === 'PresellBill' ? businessType.name : infoData.businessType.name}>业务类型 <i>*</i> </List.Item>
          <List.Item extra={billingStatus === 'PresellBill' ? takeWay.name : infoData.takeWay.name}>提货方式 <i>*</i> </List.Item>
          <List.Item extra={billingStatus === 'PresellBill' ? ReserveDeliveryDate : infoData.reserveDate}>交货时间 </List.Item>
          <i />
        </List>
      )
    } else {
      if (billingStatus === 'CashSale') {
        const businessTypes = [];
        Businesstype_DataSource.map((item) => {
          businessTypes.push({ label: item.name, value: item.id });
        })
        // let vyu = this.itemsBussinessTypes(businessTypes);
        return <div className='settle22'>
          <div className={styles.settle04}>
            {/* onClick={() => {
              this.setState({ isChooseBussiness: true })
              if(document.getElementsByClassName('fixed_height_cls').length>0){
                document.getElementsByClassName('fixed_height_cls')[0].style['height']=(clientHeight - 3.2 * window.__fontUnit)+'px';
              }
            }} <Picker className="store-list" cols={1} data={businessTypes} value={[infoData.businessType.id]} onOk={e => this.onSelect('ok', 'bussType', e)} onDismiss={e => this.onSelect('dismiss', 'bussType', e)}> */}
            <List.Item onClick={this.handEditReserve.bind(this, false)} extra={infoData.businessType.id ? infoData.businessType.name : '请选择'} arrow='horizontal'>业务类型 <i>*</i> </List.Item>
            {/* </Picker> */}
          </div>
          <CusRefer title='选择业务类型' id={infoData.businessType.id} isShow={isChooseBussiness} data={businessTypes} close={() => { this.setState({ isChooseBussiness: false }) }} ok={(item) => { this.onSelect('ok', 'bussType', [item.value]); this.setState({ isChooseBussiness: false }) }} />
        </div>;
      } else {
        return <div className='settle17'>
          <div className={styles.settle04}>
            <span> 业务类型</span>
            <em> {infoData.businessType.name}</em>
          </div>
        </div>;
      }
    }
  }

  handEditReserve (status) {
    this.props.reserveActions.showHeaderInfo(function (isEdit) {
      if (isEdit) {
        this.props.dispatch(push({ pathname: './editReserve', state: status }));
      } else {
        this.props.dispatch(push('./reserveInfo'));
      }
    }.bind(this));
  }

  renderBusinessType = () => {
    const { Businesstype_DataSource, businessType } = this.props.reserve;
    const items = _.map(Businesstype_DataSource, item => {
      return {
        label: item.name,
        value: item.id,
        ...item
      }
    })
    return (
      <div className='settle16'>
        <div className={styles.settle04}>
          <Picker data={items} value={[businessType.id]} cols={1} onChange={val => {
            this.onTypeSelect(val[0], items, 'businessType')
          }}>
            <List.Item arrow='horizontal'>业务类型</List.Item>
          </Picker>
        </div>
      </div>
    )
  }

  /* 业务类型/仓库/自定义项参照 */
  onTypeSelect = (value, items, type) => {
    const val = {};
    val[type] = _.find(items, item => item.id == value)
    this.props.reserveActions.setCommonData(val)
    this.props.reserveActions.modify()
  }

  renderMemo = (Memo, onChange) => {
    return null
    // if (this.props.uretailHeader.billingStatus === 'CashSale') {
    //   return (<List className="settle15" renderHeader={() => <i className="icon icon-edit" />}>
    //     <TextareaItem
    //       onChange={onChange}
    //       count={150}
    //       value={Memo}
    //       placeholder={'备注'}
    //     />
    //   </List>)
    // } else {
    //   return null;
    // }
  }

  onMemoChange = (value) => {
    const val = {}
    val.Memo = value;
    this.props.reserveActions.setCommonData(val);
    this.props.reserveActions.modify();
  }

  getPointControl = () => {
    const { billingStatus, infoData } = this.props.uretailHeader;
    const { bDeliveryModify } = this.props.reserve;
    const { moneyuse, points } = this.props.point;
    const { money } = this.props.product.toJS();
    const { bHasMember } = this.props.member

    if (billingStatus === 'PresellBill') {
      if (bDeliveryModify) {
        return null;
      }
    } else if (billingStatus === 'Shipment') {
      if (!infoData.bDeliveryModify) {
        return null;
      }
    }

    let pointControl = '';
    if (bHasMember && points != 0) {
      pointControl = (
        <List className='settle08'>
          <List.Item
            extra={
              <div className='point-extra'>
                <span className='point-extra-memo'>
                  {points}积分抵用{moneyuse}元
                </span>
                {
                  billingStatus === 'PresellBill' ? (!infoData.bDeliveryModify ? <Switch checked={money.Point.done} onChange={this.onPointChange} /> : <Switch checked={false} disabled />) : (billingStatus === 'Shipment' ? (infoData.bDeliveryModify ? <Switch checked={money.Point.done} onChange={this.onPointChange} /> : <Switch checked={false} disabled />) : <Switch checked={money.Point.done} onChange={this.onPointChange} />)
                }
              </div>
            }
          >积分</List.Item>
        </List>
      )
    } else {
      pointControl = (
        <List className='settle08'>
          <List.Item
            extra={
              <div className='point-extra extra-disabled'>
                <span className='point-extra-memo'>
                  0积分
                </span>
                <Switch checked={false} disabled
                />
              </div>
            }
          >积分</List.Item>
        </List>
      )
    }
    return pointControl;
  }

  modifyQuoteMoney (type, value) {
    const { money } = this.props.product.toJS();
    if (type === 'save') {
      // const { discount } = this.props;
      // let zdData = discount.zdData;
      const tsceneDiscount = getFixedNumber(this.state.sceneDiscount);
      if (tsceneDiscount > 0) {
        this.checkDiscount('scene');
      } else {
        const tempCheckNum = this.checkDiscount('scene', false, true);
        if (tempCheckNum < 2 && tempCheckNum === 0) {
          this.checkDiscount('scene', true);
        }
      }
      // this.props.paymodeActions.setPresellAndSceneMoney({receipts:getFixedNumber(this.state.receivable),scene:tsceneDiscount});
      // this.props.paymodeActions.setPresellMoney(getFixedNumber(this.state.receivable));
      this.setState({ modifyreceivablestatus: false });
      // if(parseFloat(this.state.receivable)<parseFloat(this.state.deposit)){
      //  this.setState({deposit:getFixedNumber(zdData.jhPrices)});
      isResetReceive = true;
      // }
      const { billingStatus } = this.props.uretailHeader;
      if (billingStatus === 'PresellBill') {
        this.props.paymodeActions.setDepositMoney('0');
      }
      this.props.handleOk('SceneDiscount'); // 现场折扣
      return;
    }
    const { MinPercentGiveMoneyPre } = this.props.reserve

    if (parseFloat(tempAllReceivable) < parseFloat(this.receivable)) {
      tempAllReceivable = getFixedNumber(this.receivable);
    }
    const oldmoney = tempAllReceivable;
    if (type === 'input' || type === 'inputDeposit') {
      if (type === 'inputDeposit') {
        if (parseFloat(getFixedNumber(value)) <= parseFloat(getFixedNumber(oldmoney))) {
          this.setState({ deposit: value }, function () {
            // this.props.paymodeActions.setDepositMoney(value); //07.02 禁用它  只有在移动光标触发
          });
        }
      } else if (type === 'input') {
        let tempReceivable = value;
        if (getFixedNumber(tempReceivable) < 0) {
          tempReceivable = 0 - tempReceivable;
        }
        if (!value) {
          this.setState({ receivable: value });
          return;
        }
        if (value.split('.')[1] && value.split('.')[1].length > 2) {
          tempReceivable = value;
        }
        if (parseFloat(tempReceivable) > tempAllReceivable) {
          tempReceivable = this.receivable;
        }
        const tempSceneDiscount = tempAllReceivable - parseFloat(tempReceivable);
        let tempDiscount = 0.00;
        tempDiscount = 1 - (tempSceneDiscount / tempAllReceivable).toFixed(4);
        this.setState({ receivable: tempReceivable, sceneDiscount: getFixedNumber(tempSceneDiscount), discount: getFixedNumber(tempDiscount * 100) });
      }
    } else if (type === 'blurReceivable' || type === 'blurDeposit') {
      // if(type==='blurReceivable'){
      //   if(parseFloat(getFixedNumber(value))>tempAllReceivable){
      //     if(type==='blurDeposit'){
      //        this.setState({deposit:getFixedNumber(oldmoney)});
      //        this.props.paymodeActions.setDepositMoney(getFixedNumber(oldmoney));
      //     }else{
      //        this.setState({receivable:getFixedNumber(oldmoney)});
      //     }
      //   }else if(parseFloat(getFixedNumber(value))<parseFloat(getFixedNumber(oldmoney*0.2))){
      //     if(type==='blurDeposit'){
      //        this.setState({deposit:getFixedNumber(oldmoney*0.2)});
      //        this.props.paymodeActions.setDepositMoney(getFixedNumber(oldmoney*0.2));
      //     }else{
      //       this.setState({receivable:getFixedNumber(oldmoney*0.2)});
      //     }
      //   }else{
      //     if(type==='blurDeposit'){
      //       this.props.paymodeActions.setDepositMoney(getFixedNumber(this.state.deposit));
      //     }
      //   }
      //   return;
      // }
      if (parseFloat(getFixedNumber(value)) > parseFloat(getFixedNumber(oldmoney))) {
        if (type === 'blurDeposit') {
          this.setState({ deposit: getFixedNumber(oldmoney) });
          this.props.paymodeActions.setDepositMoney(getFixedNumber(oldmoney));
        } else {
          this.setState({ receivable: getFixedNumber(oldmoney) });
        }
      } else if (parseFloat(getFixedNumber(value)) < parseFloat(getFixedNumber(oldmoney * MinPercentGiveMoneyPre * 0.01))) {
        if (type === 'blurDeposit') {
          let tempDeposit = value;
          if (getFixedNumber(tempDeposit) < 0) {
            tempDeposit = getFixedNumber(0 - tempDeposit);
          } else {
            tempDeposit = getFixedNumber(money.Gathering.value * MinPercentGiveMoneyPre * 0.01);
          }
          this.setState({ deposit: tempDeposit });
          this.props.paymodeActions.setDepositMoney(tempDeposit);
        }
        else {
          let tempReceivable = oldmoney;
          // if(value.split('.')[1] && value.split('.')[1].length>2){
          tempReceivable = getFixedNumber(value);
          // }
          if (tempReceivable < 0) {
            tempReceivable = 0 - tempReceivable;
          }
          const tempSceneDiscount = tempAllReceivable - parseFloat(tempReceivable);
          let tempDiscount = 0.00;
          tempDiscount = 1 - (tempSceneDiscount / tempAllReceivable).toFixed(4);
          this.setState({ receivable: tempReceivable, sceneDiscount: getFixedNumber(tempSceneDiscount), discount: getFixedNumber(tempDiscount * 100) });
        }
      } else {
        if (type === 'blurDeposit') {
          this.setState({ deposit: getFixedNumber(this.state.deposit) });
          this.props.paymodeActions.setDepositMoney(getFixedNumber(this.state.deposit));
          // this.props.paymodeActions.setPresellMoney(getFixedNumber(this.state.deposit));
        } else {
          this.setState({ receivable: getFixedNumber(this.state.receivable) });
        }
      }
    } else if (type === 'sceneDiscount') {
      let tempSceneDiscount = value;
      if (getFixedNumber(tempSceneDiscount) < 0) {
        tempSceneDiscount = 0 - tempSceneDiscount;
      }
      // if(value.split('.')[1] && value.split('.')[1].length>2){
      //   tempSceneDiscount = (value);
      // }else
      if (!value) {
        this.setState({ sceneDiscount: value });
        return;
      }
      let tempDiscount = 0.00;
      if (parseFloat(tempSceneDiscount) > parseFloat(this.receivable)) {
        tempDiscount = 0;
        tempSceneDiscount = this.receivable;
      } else {
        tempDiscount = 1 - (tempSceneDiscount / tempAllReceivable).toFixed(4);
      }
      this.setState({ sceneDiscount: tempSceneDiscount, discount: getFixedNumber(tempDiscount * 100), receivable: getFixedNumber(tempAllReceivable - tempSceneDiscount) });
    }/** else if(type==='inputDeposit'){
      if(parseFloat(getFixedNumber(value))<=parseFloat(getFixedNumber(oldmoney))){
         this.setState({deposit:value})
      }
    }else if(type==='blurDeposit'){
      if(parseFloat(getFixedNumber(value))>parseFloat(getFixedNumber(oldmoney))){
          this.setState({deposit:getFixedNumber(oldmoney)});
      }else if(parseFloat(getFixedNumber(value))<parseFloat(getFixedNumber(oldmoney*0.2))){
          this.setState({deposit:getFixedNumber(oldmoney*0.2)});
      }
    }**/else if (type === 'blurSceneDiscount') {
      if (!value) {
        const tempSceneDiscount = 0.00;
        let tempDiscount = 0.00;
        tempDiscount = 1 - (tempSceneDiscount / tempAllReceivable).toFixed(4);
        this.setState({ sceneDiscount: '0.00', discount: getFixedNumber(tempDiscount * 100), receivable: getFixedNumber(tempAllReceivable - tempSceneDiscount) });
      } else {
        this.setState({ sceneDiscount: getFixedNumber(value) });
      }
    } else if (type === 'blurDiscount') {
      this.setState({ discount: getFixedNumber(value) });
      if (!value) {
        const tempDiscount = getFixedNumber(100);
        const tempReceivable = getFixedNumber(getFixedNumber(oldmoney) * (parseFloat(tempDiscount) * 0.01));
        this.setState({ sceneDiscount: getFixedNumber(this.receivable - tempReceivable), discount: tempDiscount, receivable: tempReceivable });
      }
    } else if (type === 'focusDiscount') {
      if (parseFloat(value) - parseInt(value).toFixed(0) > 0) {
        // this.setState({discount:value},function(){
        this.dhDiscount.inputRef.inputRef.select();
        // }.bind(this));
      } else {
        this.setState({ discount: parseInt(value).toFixed(0) }, function () {
          this.dhDiscount.inputRef.inputRef.select();
        }.bind(this));
      }
    } else {
      let tempDiscount = value;
      if (type === 'inputDiscount') {
        if (parseFloat(tempDiscount) > 100) {
          tempDiscount = '100.00';
        } else if (parseFloat(tempDiscount) < 0) {
          tempDiscount = 0 - tempDiscount;
        }
      }
      if (value.split('.')[1] && value.split('.')[1].length > 2) {
        tempDiscount = getFixedNumber(value);
      } else if (!value) {
        this.setState({ discount: value });
        return;
      }
      const tempReceivable = getFixedNumber(getFixedNumber(tempAllReceivable) * (parseFloat(tempDiscount) * 0.01));
      this.setState({ sceneDiscount: getFixedNumber(tempAllReceivable - tempReceivable), discount: tempDiscount, receivable: tempReceivable });
    }
  }

  /* 输入框改变 */
  onChange = (val, isAll, type) => {
    const { discount } = this.props;
    if (val == '.') return;
    if (typeof (val) == 'string' && val.indexOf('.') == 1) {
      if (val.split('.').length > 2) {
        return;
      } else {
        if (val.split('.')[1] == '') {
          return;
        }
      }
    }
    // if (!this.checkChange(val)) return;

    if (isAll) {
      const zdData = discount.zdData;
      // if (!val || val == '') {
      //   val = 0;
      // }
      zdData[type] = val;
      this.props.setData({ zdData: zdData });
    } else {
      const dhData = discount.dhData;
      // if (!val || val == "") {
      //   val = 0;
      // }
      dhData[type] = val;
      this.props.setData({ dhData: dhData });
    }
  }

  checkChange = (val) => {
    if (parseFloat(val).toString() === 'NaN') {
      return false;
    } else {
      return true;
    }
  }

  onBlur = (val, isAll, type) => {
    const { discount, config } = this.props;
    const options = config.data.optionData;
    const amountofdecimal = options.amountofdecimal ? options.amountofdecimal.value : 2;/* 金额小数位 */
    // let monovalentdecimal = options.monovalentdecimal ? options.monovalentdecimal.value : 2;/*单价小数位*/
    if (isAll) {
      const zdData = discount.zdData;
      if (!val || val == '') {
        val = 0;
      }
      if (type == 'jmPrices') { /* 减免金额 */
        zdData.jmPrices = parseFloat(val).toFixed(amountofdecimal);
        zdData.jhPrices = parseFloat(zdData.zdPrices - val).toFixed(amountofdecimal);
        zdData.discount = parseFloat(zdData.jhPrices / zdData.zdPrices * 100).toFixed(2);
      } else if (type == 'jhPrices') { /* 减后金额 */
        zdData.jmPrices = parseFloat(zdData.zdPrices - val).toFixed(amountofdecimal);
        zdData.jhPrices = parseFloat(val).toFixed(amountofdecimal);
        zdData.discount = parseFloat(val / zdData.zdPrices * 100).toFixed(2);
      } else { /* 折扣率 */
        zdData.jmPrices = parseFloat(zdData.zdPrices - zdData.zdPrices * val / 100).toFixed(amountofdecimal);
        zdData.jhPrices = parseFloat(zdData.zdPrices * val / 100).toFixed(amountofdecimal);
        zdData.discount = val;
      }

      this.props.setData({ zdData: zdData });
    } else {
      const dhData = discount.dhData;
      if (!val || val == '') {
        val = 0;
      }
      if (type == 'zhPrices') {
        dhData.zhPrices = parseFloat(val).toFixed(amountofdecimal);
        dhData.discount = parseFloat(val / dhData.dqPrices * 100).toFixed(2);
        dhData.bdPrices = parseFloat(dhData.zhPrices * dhData.quantity).toFixed(amountofdecimal);
      } else if (type == 'bdPrices') {
        dhData.zhPrices = parseFloat(val / dhData.quantity).toFixed(amountofdecimal);
        dhData.bdPrices = parseFloat(val).toFixed(2);
        dhData.discount = parseFloat((dhData.zhPrices / dhData.dqPrices) * 100).toFixed(amountofdecimal);
      } else {
        dhData.zhPrices = parseFloat(dhData.dqPrices * val / 100).toFixed(amountofdecimal);
        dhData.discount = parseFloat(val).toFixed(2);
        dhData.bdPrices = parseFloat(dhData.zhPrices * dhData.quantity).toFixed(amountofdecimal);
      }

      this.props.setData({ dhData: dhData });
    }
  }

  goback = () => {
    this.initModal();
    // this.props.dispatch(closePaymodal())
  }

  initModal (callback) {
    const { billingStatus } = this.props.uretailHeader;
    const { money } = this.props.product.toJS();
    Modal.alert(<div className='icon_wenhao' />, '你确定要放弃结算吗?', [
      { text: '取消', onPress: () => console.log('cancel') },
      {
        text: '确定', onPress: function () {
          if (billingStatus === 'CashSale') {
            this.props.paymodeActions.setPresellMoney(getFixedNumber(money.Total.value));
          } else if (billingStatus === 'PresellBill') {
            this.props.paymodeActions.setDepositMoney('0');
            this.props.paymodeActions.setPresellAndSceneMoney({ receipts: getFixedNumber(tempAllReceivable), scene: 0 });
          }
          this.props.dispatch(genAction('PLATFORM_UI_BILLING_DATASOURCE_REMOVE_CODE'), '');
          this.props.cancelDiscount();
          this.props.dispatch(rollBackCoupon())
          this.props.dispatch(rollBackPoint())
          this.props.dispatch(rollBackPromotion())
          isResetPay = false;
          if (!callback)
            this.props.dispatch(goBack())
          else
            callback();
        }.bind(this)
      },
    ]);
  }

  discountControll (discount) {
    const discounts = [9.0, 8.0, 8.8, 8.5, 7.0, 6.0];
    const controll = [];
    discounts.map((obj) => {
      if (discount === obj) {
        controll.push(<b className='active' onClick={this.modifyQuoteMoney.bind(this, '', obj)}>{obj}折</b>);
      } else {
        controll.push(<b onClick={this.modifyQuoteMoney.bind(this, '', obj)}>{obj}折</b>);
      }
    })

    return (
      <div className='tags clearfix'>
        <div className='settle0667'>
          {controll}
          {/* <b onClick={this.modifyQuoteMoney.bind(this,'',9.0)}>9折</b><b onClick={this.modifyQuoteMoney.bind(this,'',8.0)}>8折</b><b onClick={this.modifyQuoteMoney.bind(this,'',8.8)}>8.8折</b>
        </div>
        <div  className="settle0667">
          <b onClick={this.modifyQuoteMoney.bind(this,'',8.5)}>8.5折</b><b onClick={this.modifyQuoteMoney.bind(this,'',7.0)}>7折</b><b onClick={this.modifyQuoteMoney.bind(this,'',6.0)}>6折</b> */}
        </div>
      </div>
    )
  }

  salePromition () {
    const { billingStatus, infoData } = this.props.uretailHeader;
    const { bDeliveryModify } = this.props.reserve
    const { checkedPromotion } = this.props.promotion;
    const { money } = this.props.product.toJS()
    let promotionExtra = '请选择';
    // const defaultReserve = this.defaultReserveInfo();
    let isExistsPromition = false;
    if (checkedPromotion.length > 0) {
      this.checkDiscount('sale');
      isExistsPromition = true;
      if (checkedPromotion.length == 1) {
        promotionExtra = <span className='money-extra'><em>{checkedPromotion[0].name}</em></span>;
      } else {
        promotionExtra = <span className='money-extra'>已选中<em>{checkedPromotion.length}</em>个促销活动</span>;
      }
    } else {
      const tempCheckNum = this.checkDiscount('sale', false, true);
      if (tempCheckNum < 2 && tempCheckNum === 0) {
        this.checkDiscount('sale', true);
        console.log('已存在sale,是最后一个');
      }
    }
    const view = <List className='settle08'><List.Item extra={promotionExtra} arrow='horizontal' onClick={() => {
      const tempCheckNum = this.checkDiscount('sale', false, true);
      if (tempCheckNum < 2 && tempCheckNum === 1) {
        console.log('已存在sale,不是最后一个');
        return;
      }

      if (billingStatus === 'PresellBill') {
        if (!bDeliveryModify) {
          this.props.paymodeActions.setDepositMoney('0.00');
        } else {
          return;
        }
      } else if (billingStatus === 'Shipment') {
        if (!infoData.bDeliveryModify) {
          return;
        } else {
          this.props.paymodeActions.setDepositMoney(money.Deposit.value);
        }
      }
      this.props.showModal('SetPromotionFocus');
      isResetReceive = true;
      // this.props.canOpen(function () { isResetReceive = true; })
    }}> 促销活动</List.Item></List>
    if (isExistsPromition) {
      return view;
    }
    if (billingStatus === 'PresellBill') {
      if (!bDeliveryModify) {
        return view;
      }
    } else if (billingStatus === 'Shipment') {
      if (infoData.bDeliveryModify) {
        return view;
      }
    } else {
      return view;
    }
  }

  discountCoupon () {
    const { money } = this.props.product.toJS()
    const { bDeliveryModify } = this.props.reserve
    const { billingStatus, infoData } = this.props.uretailHeader
    if (money.Coupon.value) {
      this.checkDiscount('coupon');
    } else {
      const tempCheckNum = this.checkDiscount('coupon', false, true);
      if (tempCheckNum < 2 && tempCheckNum === 0) {
        this.checkDiscount('coupon', true);
        console.log('已存在sale,是最后一个');
      }
    }
    const view = <List className='settle08'><List.Item arrow='horizontal' value={'￥' + money.Coupon.value} extra={money.Coupon.value ? <span className='money-extra'>￥<em>{money.Coupon.value}</em></span> : '请选择'} onClick={() => {
      const tempCheckNum = this.checkDiscount('coupon', false, true);
      if (tempCheckNum < 2 && tempCheckNum === 1) {
        console.log('已存在coupon,不是最后一个');
        return;
      }
      if (billingStatus === 'PresellBill') {
        if (!bDeliveryModify) {
          this.props.paymodeActions.setDepositMoney('0.00');
        } else {
          return;
        }
      } else if (billingStatus === 'Shipment') {
        if (!infoData.bDeliveryModify) {
          return;
        } else {
          this.props.paymodeActions.setDepositMoney(money.Deposit.value);
        }
      }
      this.props.showModal('Coupon');
      // this.props.dispatch(push('/coupon'))
    }}>优惠券</List.Item></List>
    if (money.Coupon.value) {
      return view;
    }
    if (billingStatus === 'PresellBill') {
      if (!bDeliveryModify) {
        return view;
      }
    } else if (billingStatus === 'Shipment') {
      if (infoData.bDeliveryModify) {
        return view;
      }
    } else {
      return view;
    }
  }

  modifyReceive () {
    const tempCheckNum = this.checkDiscount('scene', false, true);
    if (tempCheckNum < 2 && tempCheckNum === 1) {
      console.log('已存在sale,不是最后一个');
      return;
    }
    if (parseFloat(tempAllReceivable) < parseFloat(this.receivable)) {
      tempAllReceivable = getFixedNumber(this.receivable);
    }
    if (!isusePoint) {
      this.props.setData({ activeKey: 'zdzk', focusKey: '', doneActiveKey: 'zdzk' });
      // this.props.executeAction('SceneDiscount');
      this.props.showModal('SceneDiscount');
      this.setState({ receivable: this.receivable, modifyreceivablestatus: true });
    }
  }

  discountControls () {
    const { zdData } = this.props.discount;
    const { modalKey_Current } = this.props.actions;
    if (modalKey_Current === 'SceneDiscount') {
      const clientHeight = window.screen.height;
      document.body.style.overflow = 'hidden';
      if (document.getElementsByClassName('fixed_height_cls').length > 0) {
        document.getElementsByClassName('fixed_height_cls')[0].style.overflow = 'hidden';
        document.getElementsByClassName('fixed_height_cls')[0].style.height = (clientHeight - 3.2 * window.__fontUnit) + 'px';
      }
    } else {
      document.body.style.overflow = 'auto';
      if (document.getElementsByClassName('fixed_height_cls').length > 0) {
        document.getElementsByClassName('fixed_height_cls')[0].style.overflow = 'auto';
        document.getElementsByClassName('fixed_height_cls')[0].style.height = 'auto';
      }
    }
    return (
      <div className='billing-settleDetail-discount-sm' style={{
        display: (modalKey_Current === 'SceneDiscount' ? 'flex' : 'none')
      }}>
        <div className='change-price-modal'>
          <div>
            <i className='icon icon-guanbi1' onClick={() => {
              this.props.handleCancel();
              this.setState({ modifyreceivablestatus: false },
                function () { this.closeDiscountPanel(); }.bind(this));
            }} />
          </div>
          <div className='ys-money'>
            <label>应收金额</label>  <span><em>￥</em><i>{tempAllReceivable}</i></span>
          </div>
          {/* <div className="gh-money">
                    <InputItem onBlur={this.modifyQuoteMoney.bind(this,'blurReceivable')} onChange={this.modifyQuoteMoney.bind(this,'input')} type="digit" value={this.state.receivable} >改后金额 <em>￥</em></InputItem>

                </div> */}

          <div className='gh-money'>
            <InputItem ref={dhDiscount => { this.dhDiscount = dhDiscount }} clear onBlur={(value) => this.onBlur(value, true, 'discount')} onChange={(value) => this.onChange(value, true, 'discount')} type='digit' placeholder='0.00' value={zdData.discount}>折扣率% </InputItem>
            {/** *onFocus={this.modifyQuoteMoney.bind(this,'focusDiscount')}**onBlur={this.modifyQuoteMoney.bind(this,'blurDiscount')}  onChange={this.modifyQuoteMoney.bind(this,'inputDiscount') */}
          </div>
          <div className='gh-money'>
            <InputItem onBlur={(value) => this.onBlur(value, true, 'jmPrices')} clear onChange={(value) => this.onChange(value, true, 'jmPrices')} type='digit' value={zdData.jmPrices}>折扣额 </InputItem>
            {/** *onBlur={this.modifyQuoteMoney.bind(this,'blurSceneDiscount')}  onChange={this.modifyQuoteMoney.bind(this,'sceneDiscount')}**/}
          </div>
          <div className='gh-money'>
            <InputItem onBlur={(value) => this.onBlur(value, true, 'jhPrices')} clear onChange={(value) => this.onChange(value, true, 'jhPrices')} type='digit' value={zdData.jhPrices}>折后金额 </InputItem>
            {/* <label>改后金额</label> <span><em>￥</em><input type="digit" onBlur={this.modifyQuoteMoney.bind(this,'blurReceivable')} onChange={this.modifyQuoteMoney.bind(this,'input')}  value={this.receivable} /></span> */}
          </div>
          {/* {this.discountControll(this.state.discount)} */}
          <div className='settle0667 btn'>
            <Button style={{ color: '#000' }} onClick={this.modifyQuoteMoney.bind(this, 'save')} type='warning'>确定</Button>
          </div>
        </div>
      </div>
    )
  }

  // 是否使用了现金结算
  isCashUse = () => {
    const { paymodes } = this.props.paymode
    let using = false
    _.forEach(paymodes, pay => {
      if (pay.paymentType == 1 && pay.value > 0) {
        using = true
      }
    })
    return using
  }

  render () {
    const { products, money } = this.props.product.toJS()
    const { billingStatus, infoData } = this.props.uretailHeader
    const { Memo, isEdited, MinPercentGiveMoneyPre, bDeliveryModify } = this.props.reserve
    const { payment, currentPayment, paymodes, delZero } = this.props.paymode
    const { bHasMember, memberInfo } = this.props.member
    // const { checkedPromotion } = this.props.promotion;
    // const paymodeActions = this.props.paymodeActions
    const storage_balance = bHasMember ? (memberInfo.data.storage_balance ? memberInfo.data.storage_balance : 0) : 0;
    // let promotionExtra = '请选择';
    const defaultReserve = this.defaultReserveInfo();
    const bHasBuyGoods = _.filter(products, item => { return item.fQuantity > 0 }).length > 0;

    // if (checkedPromotion.length > 0) {
    //   if (checkedPromotion.length == 1) {
    //     promotionExtra = <span className="money-extra"><em>{checkedPromotion[0].name}</em></span>;
    //   } else {
    //     promotionExtra = <span className="money-extra">已选中<em>{checkedPromotion.length}</em>个促销活动</span>;
    //   }
    // }

    /* 积分抵扣 */
    const pointControl = this.getPointControl();

    const preferentials = [];
    let preferentialMoney = 0;
    for (const attr in money) {
      const { value, text, preferential } = money[attr];
      if (value === 0 || parseFloat(value) === 0 || !preferential || billingStatus === 'PresellBack' || billingStatus === 'Shipment' && infoData.bDeliveryModify === false) continue;
      // if (attr != 'Coupon') {
      preferentialMoney += Number(value);
      preferentials.push(
        // <div key={attr} className="billing-touch-preferential">
        //   <span>{text}</span><span className="fr member-sale">{getFixedNumber(value)}</span>
        // </div>
        <div key={attr} className={styles.settle05}>
          <span>-<em>￥</em>{getFixedNumber(value)}</span>{text}
        </div>
      );
      // }
    }

    if ((billingStatus === 'NoFormerBackBill' || billingStatus === 'FormerBackBill') && bHasBuyGoods == false) {
      preferentialMoney = parseFloat(preferentialMoney) + parseFloat(getFixedNumber(money.BackDiscount.value)) + parseFloat(getFixedNumber(money.FoldDiscount.value));
      if (preferentialMoney < 0) {
        preferentialMoney = 0 - preferentialMoney;
      }
    }
    preferentialMoney = getFixedNumber(preferentialMoney)

    this.total = getFixedNumber(money.Total.value)
    // 应收
    this.receivable = getFixedNumber(money.Gathering.value)
    // 真实价格
    this.real = getFixedNumber(money.Real.value)

    this.deposit = getFixedNumber(money.Deposit.value)
    if (isResetReceive && this.state.receivable !== this.receivable && billingStatus === 'PresellBill') {
      isResetReceive = false;
      this.setState({ sceneDiscount: getFixedNumber(money.Scene.value), deposit: this.receivable });
    }
    this.deposit = this.state.deposit;
    // 实收
    this.receipts = getFixedNumber(_.reduce(paymodes, (a, b) => {
      return Number(a) + (isNaN(b.value) ? 0 : Number(b.value))
    }, 0))

    // const lastBill = isMounted && JSON.parse(localStorage.getItem('billing_lastBill'))

    // const billingInfo = this.getBillingInfo();

    const productsIsEmpty = _.isEmpty(products)
    // let height = window.screen.height;

    return (
      <div>
        <div className='settle01 fixed-top fixed_height_cls'>
          <NavBar onLeftClick={this.goback} title='结算' />

          {bHasMember && (<div className={styles.settle02}>
            <span>
              {
                bHasMember && (memberInfo.data.portrait || memberInfo.data.fans_portrait)
                  ? <img src={memberInfo.data.portrait || memberInfo.data.fans_portrait} />
                  : ''
              }
            </span>
            {memberInfo.data.realname}
          </div>)}

          {/* 选择业务类型 */}
          {/*  {this.renderBusinessType()} */}

          {/* 渲染业务类型 */}

          {defaultReserve}

          <div className={styles.settle03}>
            {/*   <h3>
            <span></span><span></span><span></span><span></span><em>共99件<Icon type="icon-jiantou"/></em>
          </h3>
*/}
            {products.length > 1 ? (
              <ProductsDisplay
                totalQuantity={money.TotalQuantity.value.toFixed(2)}
                total={this.total}
                money={money}
                products={_.slice(products, 0, 3)} onClick={
                  () => { this.props.historyPush('/productsDetailList') }
                }
              />
            ) : (
              <div className='settle18'>
                <ProductList products={_.slice(products, 0, 1)} />
                <h4>
                  <span>{this.total < 0 ? '-' : ''}￥<em>{this.total < 0 ? getFixedNumber(0 - this.total) : getFixedNumber(this.total)}</em></span>商品合计
                </h4>
              </div>
            )}

          </div>

          {
            billingStatus === 'CashSale' || billingStatus === 'FormerBackBill' || billingStatus === 'PresellBill' || billingStatus === 'NoFormerBackBill' || (billingStatus === 'Shipment') ? (
              <div className='settle04'>

                {/* <div className={styles.settle05}>
                <span>-<em>￥</em>{money.Member.value}</span>会员折扣
              </div> */}
                <div className='billing-touch-conts'>
                  <div className='billing-touch-list'>
                    {preferentials}

                    {/* 退货时如果有折扣,展现“退货折扣额 */}
                    {(billingStatus === 'NoFormerBackBill' || billingStatus === 'FormerBackBill') && money.BackDiscount.value != 0 &&
                      <div className='return-discount'><span>退货折扣额</span><span
                        className='fr'>{getFixedNumber(money.BackDiscount.value)}</span>
                      </div>}
                    {/* 交货，退订时如果有折扣,展现“折扣额 */}
                    {(billingStatus === 'Shipment' && infoData.bDeliveryModify === false || billingStatus === 'PresellBack') && money.Preferential.value != 0 &&
                      <div className='return-discount'><span>折扣额</span><span
                        className='fr'>{getFixedNumber(money.Preferential.value)}</span>
                      </div>}
                    {/* 原单退货，如果原单有折扣,展现“原单折扣额 */}
                    {(billingStatus === 'FormerBackBill' || billingStatus === 'NoFormerBackBill') && money.FoldDiscount.value != 0 &&
                      <div className='return-discount'><span>原单折扣额</span><span
                        className='fr'>{getFixedNumber(money.FoldDiscount.value)}</span>
                      </div>}

                  </div>
                </div>
                {((billingStatus !== 'NoFormerBackBill' && billingStatus !== 'FormerBackBill') || bHasBuyGoods == true) && this.salePromition()}
                {/*  <List className="settle08">

                <List.Item extra={promotionExtra} arrow="horizontal" onClick={() => {
                  if(billingStatus === 'PresellBill'){
                    if(!infoData.bDeliveryModify){
                        this.props.canOpen()
                    }
                  }else if(billingStatus === 'Shipment'){
                      if(infoData.bDeliveryModify){
                         this.props.canOpen()
                      }
                  }else{
                    this.props.canOpen()
                  }
                }}>
                  促销活动
                </List.Item>
              </List> */}
                {
                  ((billingStatus !== 'NoFormerBackBill' && billingStatus !== 'FormerBackBill') || bHasBuyGoods == true && bHasMember)
                    ? pointControl
                    : ''
                }
                {/* <div className={styles.settle05}>
                <span>330积分抵用3.30元</span>积分
              </div> */}
                {((billingStatus !== 'NoFormerBackBill' && billingStatus !== 'FormerBackBill') || bHasBuyGoods == true) && this.discountCoupon()}
                {/* <List className="settle08">
                <List.Item arrow="horizontal" value={'￥' + money.Coupon.value}
                          extra={money.Coupon.value ?
                            <span className="money-extra">￥<em>{money.Coupon.value}</em></span> : "请选择"}
                          onClick={() => {
                            if(billingStatus === 'PresellBill'){
                                if(!infoData.bDeliveryModify){
                                   this.props.dispatch(push('/coupon'))
                                }
                            }else if(billingStatus === 'Shipment'){
                                if(infoData.bDeliveryModify){
                                  this.props.dispatch(push('/coupon'))
                                }
                            }else{
                               this.props.dispatch(push('/coupon'))
                            }
                          }}>

                  优惠券
                  // <span>￥<em>{this.total}</em></span>
                </List.Item>
                // <List.Item>
                //   <InputItem placeholder="改价" type="money"/>
                // </List.Item>
              </List> */}
                <div className='settle08'>
                  {this.renderDelZero(delZero)}
                </div>

                <h4>
                  <span className='heji'>优惠合计</span><span className='money'>-￥<em>{(billingStatus === 'Shipment' && !infoData.bDeliveryModify) ? getFixedNumber(money.Preferential.value) : preferentialMoney}{/* 142.80 */}</em></span>
                </h4>
              </div>
            ) : (''
            // <div className='settle04'>
            // <List className='my-list'>
            //     <List.Item extra={'￥'+getFixedNumber(money.Total.value)}>商品金额</List.Item>
            //     <List.Item className="color-red" extra={'￥'+getFixedNumber(money.Preferential.value)}>促销优惠</List.Item>
            //     <List.Item extra={'￥'+this.receivable}>应收金额</List.Item>
            //     <List.Item extra={'￥'+getFixedNumber(money.Deposit.value)}>订金金额</List.Item>
            // </List>
            // </div>
            )
          }

          {
            (billingStatus === 'Shipment') ? (
              <div className='settle04'>
                <List className='my-list'>
                  <List.Item extra={'￥' + getFixedNumber(money.Total.value)}>商品金额</List.Item>
                  <List.Item className='color-red' extra={'￥' + (getFixedNumber(money.Preferential.value))}>促销优惠</List.Item>
                  {/* <List.Item extra={'￥' + this.receivable}>应收金额</List.Item> */}
                  <List.Item extra={'￥' + getFixedNumber(money.Deposit.value)}>订金金额</List.Item>
                </List>
              </div>) : ''
          }

          {
            billingStatus === 'CashSale' || billingStatus === 'PresellBill' || (billingStatus === 'Shipment' && infoData.bDeliveryModify) ? (<div className={styles.settle04}>
              <div className='settle06 ys-money-je' onClick={() => {
                if (billingStatus === 'CashSale' || (billingStatus === 'Shipment' && infoData.bDeliveryModify) || (billingStatus === 'PresellBill' && !bDeliveryModify)) {
                  this.modifyReceive()
                }
              }}>
                {(billingStatus === 'CashSale' || (billingStatus === 'Shipment' && infoData.bDeliveryModify) || (billingStatus === 'PresellBill' && !bDeliveryModify)) ? <Icon type='icon-bianji' /> : ''}
                <span><em>￥</em><i>{this.receivable}</i>{/* <Icon type="icon-bianji"/> */}</span>应收金额
              </div>
            </div>) : ''
          }
          {
            billingStatus === 'PresellBill' ? (
              <div>
                <div className={styles.settle04}>
                  <div className='settle06'>
                    <InputItem ref={el => { this.eldingjin = el }} style={{ width: ((this.receivable + '').length * 0.22) + 'rem' }} extra={<Icon type='icon-bianji' onClick={() => { this.eldingjin.focus() }} />} onBlur={this.modifyQuoteMoney.bind(this, 'blurDeposit')} onChange={this.modifyQuoteMoney.bind(this, 'inputDeposit')} type='digit' value={this.deposit}>订金金额 <em style={{ marginRight: ((this.deposit + '').length * 0.22 + 0.55) + 'rem' }}>￥</em></InputItem>
                    {/* <span onClick={()=>{console.log('修改订金金额');}}><em>￥</em><i>{parseInt(money.Deposit.value)===0?this.receivable:getFixedNumber(money.Deposit.value)}</i></span>订金金额 */}
                  </div>
                </div>
                <span className='ydj_tips'>预订交款比例不得低于{MinPercentGiveMoneyPre}%，<i>{getFixedNumber(this.receivable * MinPercentGiveMoneyPre * 0.01)}元</i></span>
              </div>
            ) : ''
          }
          {
            billingStatus === 'PresellBack' || (billingStatus === 'Shipment' && !infoData.bDeliveryModify) ? (<div className={styles.settle04}>
              <div className='settle06'>
                <span><em>￥</em><i>{this.receivable}</i>{/* <Icon type="icon-bianji"/> */}</span>应收金额
              </div>
            </div>) : ''
          }
          <div className={styles.settle07}>
            <h4>选择支付方式</h4>
            <div className={styles.settle08}>{this.renderTabs(payment, currentPayment, storage_balance)}</div>
          </div>
          {this.renderMemo(Memo, this.onMemoChange)}

          <div className='billing-bottom-btn'>
            {
              billingStatus === 'CashSale' ? (
                <div>
                  <div className='billing-bottom-rt'>
                    <div>
                      {/*  交货状态下显示'已收款' */}
                      {billingStatus === 'Shipment' && <div className='clearfix billing-touch-receivables'><span>已收款</span><span
                        className='fr'>{getFixedNumber(money.Deposit.value)}</span></div>}
                    </div>
                    <div className='settle09'>
                      应收
                      <span><em>￥</em>{this.receivable}</span>
                    </div>
                  </div>

                </div>
              ) : ''
            }
            {
              billingStatus === 'NoFormerBackBill' || billingStatus === 'FormerBackBill' ? (
                <div>
                  <div className='billing-bottom-rt'>
                    <div className='settle09'>
                      退款金额
                      <span>{getFixedNumber(money.Gathering.value) < 0 ? '-' : ''}<em>￥</em>{getFixedNumber(money.Gathering.value) < 0 ? getFixedNumber(0 - getFixedNumber(money.Gathering.value)) : getFixedNumber(money.Gathering.value)}</span>
                    </div>
                  </div>
                </div>
              ) : ''
            }
            {
              billingStatus === 'PresellBill' ? (
                <div>
                  <div className='billing-bottom-rt'>
                    <div className='settle09'>
                      订金金额
                      <span><em>￥</em>{this.deposit}</span>
                    </div>
                  </div>
                </div>
              ) : ''
            }
            {
              billingStatus === 'PresellBack' || billingStatus === 'Shipment' ? (
                <div>
                  <div className='billing-bottom-rt'>
                    <div className='settle09'>
                      应收金额
                      <span><em>￥</em>{this.receivable}</span>
                    </div>
                  </div>
                </div>
              ) : ''
            }

            <div className='billing-Settlement-btn'>
              <Button className='Settlement-btn'
                disabled={productsIsEmpty}
                onClick={async () => {
                  // if (!this.validateSettle()) return
                  const valid = await this.validateSettle();
                  if (!valid) return;
                  if (!isEdited && billingStatus === 'PresellBill') {
                    this.handEditReserve(true);
                    return;
                  }
                  recordDiscount = [];
                  isusePoint = false;
                  isResetReceive = false;
                  if (billingStatus === 'PresellBack' || billingStatus === 'FormerBackBill')
                    this.props.dispatch(updatePaymodesDuetoBack())
                  setTimeout(() => {
                    !productsIsEmpty && this.props.dispatch(getDelZeroResult).then(result => {
                      if (result !== false) {
                        this.props.dispatch(handleSettlePayment({
                          paymentType: payment[currentPayment].paymentType,
                          paidIn: result,
                          billingStatus,
                          paymentId: currentPayment,
                          storage_balance,
                          minReceivable: getFixedNumber(this.receivable * MinPercentGiveMoneyPre * 0.01),
                        }))
                      }
                    })
                  }, 0)
                }}>结算</Button>
            </div>
          </div>
          <div ref='discountControls'>
            {this.discountControls()}
          </div>
        </div>
        <Operator />
      </div>
    )
  }
}
function mapStateToProps (state) {
  return {
    paymode: state.paymode.toJS(),
    money: state.money,
    product: state.product,
    reserve: state.reserve.toJS(),
    uretailHeader: state.uretailHeader.toJS(),
    member: state.member.toJS(),
    promotion: state.promotion.toJS(),
    point: state.point.toJS(),
    discount: state.discount.toJS(),
    config: state.config.toJS(),
    actions: state.actions.toJS(),
    globalState: state
  }
}

function mapDispatchToProps (dispatch) {
  return {
    handleOk: bindActionCreators(handleOk, dispatch),
    handleCancel: bindActionCreators(handleCancel, dispatch),
    showModal: bindActionCreators(showModal, dispatch),
    paymodeActions: bindActionCreators(paymodeActions, dispatch),
    historyPush: bindActionCreators(push, dispatch),
    getPoint: bindActionCreators(getPoint, dispatch),
    usePonit: bindActionCreators(usePonit, dispatch),
    setData: bindActionCreators(setData, dispatch),
    cancelDiscount: bindActionCreators(cancelDiscount, dispatch),
    reserveActions: bindActionCreators(reserveActions, dispatch),
    executeAction: bindActionCreators(executeAction, dispatch),
    dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SettleDetail)
