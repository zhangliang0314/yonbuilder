
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar';
import * as reserveActions from 'src/common/redux/modules/billing/reserve';
import {getCustomer} from 'src/common/redux/modules/billing/reserve';
import { List, Button, InputItem, DatePicker, Picker, TextareaItem } from 'antd-mobile';
import { push, goBack } from 'react-router-redux'
import * as billingRefer from '../../reducers/modules/billingRefer'
import { getDelZeroResult, handleSettlePayment, setPresellMoney } from 'src/common/redux/modules/billing/paymode'
import _ from 'lodash'
import { dateFormat } from '@mdf/cube/lib/helpers/formatDate';
import CusRefer from 'src/common/components/refer/CusRefer';
import { genAction } from '@mdf/cube/lib/helpers/util';

const nowTimeStamp = Date.now();
const now = new Date(nowTimeStamp);
let tempRegion = [];
let isDefinedControl = false;
// let isDataSourceType=null;
class EditReserve extends Component {
  constructor (props) {
    super(props);
    this.state = {
      date: now,
      areas: [],
      vals: {},
      address: { label: '', value: '' },
      isChooseBussiness: false
    };
    this.check = false;
  }

  componentWillMount () {
    const { Region_DataSource, WareHouse_DataSource, Businesstype_DataSource } = this.props.reserve;
    if (Region_DataSource && Region_DataSource.length <= 0) {
      this.props.reserveActions.getRegion();
    }
    if (WareHouse_DataSource && WareHouse_DataSource.length <= 0) {
      this.props.reserveActions.getWareHouse();
    }
    if (Businesstype_DataSource && Businesstype_DataSource.length <= 0) {
      this.props.reserveActions.getBusinessType(true, '', true);
    }
  }

  init () {
    if (this.state.vals.businessType) {
      return;
    }
    const { uretailHeader, reserveActions, reserve, member, dispatch } = this.props;
    const { Contacts, Phone } = reserve;
    // if (cb.utils.isEmpty(businessType) && cb.utils.isEmpty(takeWay)) {
    if(uretailHeader.billingStatus === 'PresellBill') {
      const val = {};
      if (cb.utils.isEmpty(Contacts) && member.memberInfo.data ) {
        val.Contacts = member.memberInfo.data.realname;
      }
      if (cb.utils.isEmpty(Phone) && member.memberInfo.data ) {
        val.Phone = member.memberInfo.data.phone;
      }
      reserveActions.setCommonData(val);
    }else{
      const val = {};
      val.bDeliveryModify = uretailHeader.infoData.isUpdItemBySend;
      val.bPreselllockStock = uretailHeader.infoData.isPreCalcBalance;
      val.MinPercentGiveMoneyPre = uretailHeader.infoData.MinPercentGiveMoneyPre;
      val.takeWay = uretailHeader.infoData.takeWay;
      val.isDistribCenter = uretailHeader.infoData.isDistribCenter;
      val.businessType = uretailHeader.infoData.businessType;
      val.ReserveDeliveryDate = uretailHeader.infoData.reserveDate;
      val.Phone = uretailHeader.infoData.phone;
      val.Contacts = uretailHeader.infoData.contacts;
      val.Memo = uretailHeader.infoData.memo;
      val.Address = uretailHeader.infoData.address;
      val.addressCascader = uretailHeader.infoData.addressCascader;
      if (cb.utils.isEmpty(Contacts) && member.memberInfo.data ) {
        val.Contacts = member.memberInfo.data.realname;
      }
      if (cb.utils.isEmpty(Phone) && member.memberInfo.data ) {
        val.Phone = member.memberInfo.data.phone;
      }
      reserveActions.setCommonData(val);
    }
    if(uretailHeader.billingStatus === 'CashSale') {
      dispatch(getCustomer());
    }
  }

  /* 仓库 */
  onWareHouseClick = () => {
    this.props.reserveActions.beforeWareHouseRefer();
    this.props.dispatch(push('/billingRefer', 'editReserve'));
  }

  componentDidMount () {
    // const {Region_DataSource} = this.props.reserve;
    // Region_DataSource.map((obj)=>{
    //     this.getArea(obj);
    // });
    // this.setState({areas:Region_DataSource});
    this.init();
  }

  getArea (obj) {
    obj.label = obj.shortname;
    obj.value = obj.id;
    if (obj.children && obj.children.length > 0) {
      obj.children.map((objchild) => {
        this.getArea(objchild);
      });
    }
  }

  setBussinessType (businessType) {
    if (!businessType) return;
    const { takeWay } = this.props.reserve;
    const vals = this.state.vals;
    vals.businessType = businessType;
    if (businessType.isDistribCenter) {
      vals.takeWay = { id: 2, name: '中心配送' };
    } else {
      vals.takeWay = takeWay;
    }
    this.setState({ vals: vals });
  }

  inputChange (type, value) {
    const { reserveActions, uretailHeader } = this.props;
    const val = {};
    val[type] = value;
    if(uretailHeader.billingStatus === 'CashSale') {
      const infoData = uretailHeader.infoData;
      infoData[type.toLocaleLowerCase()] = value;
      this.props.dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', { infoData: infoData }));
    }
    reserveActions.setCommonData(val);
  }

  handleOk = () => {
    const { reserve, reserveActions, dispatch, location } = this.props;
    const { billingStatus } = this.props.uretailHeader;
    if(billingStatus === 'CashSale') {
      dispatch(goBack());
      return;
    }
    const businessTypeId = reserve.businessType.id;
    if (!businessTypeId || businessTypeId == '') {
      reserveActions.setCommonData({ check: true });
      return;
    }
    reserveActions.setReserveIsEdit({ isEdited: true });
    reserveActions.modify();
    reserveActions.setVisible(false);
    reserveActions.setCommonData({ check: false });
    if (location.state) {
      const { products } = this.props.product;

      const { currentPayment, payment } = this.props.paymode;
      const { memberInfo, bHasMember } = this.props.member;
      const productsIsEmpty = _.isEmpty(products);
      const storage_balance = bHasMember ? (memberInfo.data.storage_balance ? memberInfo.data.storage_balance : 0) : 0;
      !productsIsEmpty && this.props.dispatch(getDelZeroResult).then(result => {
        if (result !== false) {
          this.props.dispatch(handleSettlePayment({
            paymentType: payment[currentPayment].paymentType,
            paidIn: result,
            billingStatus,
            paymentId: currentPayment,
            storage_balance,
          }))
        }
      })
    } else {
      dispatch(goBack());
    }
  }

  getTakeWayDataSource = (data) => {
    const { storeType } = this.props.reserve;
    const takeWayData = data.split(',');
    const takeWay_DataSource = [];
    takeWayData.map((data, index) => {
      if (data == '') return;
      if (data == '1') takeWay_DataSource.push({ id: data, name: '本店自提' });
      if (data == '3') takeWay_DataSource.push({ id: data, name: '本店配送' });
      if (data == '2' && storeType != '2' && storeType != '3') takeWay_DataSource.push({ id: data, name: '中心配送' });
    });
    return takeWay_DataSource;
  }

  getStringLength = (str) => {
    if (!str) str = '';
    let realLength = 0; const len = str.length; let charCode = -1;
    for (var i = 0; i < len; i++) {
      charCode = str.charCodeAt(i);
      if (charCode >= 0 && charCode <= 128) {
        realLength += 1;
      } else {
        realLength += 2;
      }
    }
    return realLength
  }

  onDefineFocus = (cSelfDefineType, visible) => {
    if (visible) {
      this.props.reserveActions.getDefineRefById(cSelfDefineType);
    }
  }

  onChange = (e, type) => {
    const { infoData, billingStatus } = this.props.uretailHeader;
    const val = {};
    let len = 0;
    let oval = '';
    if (e.constructor === Array) {
      len = this.getStringLength(e[0]);
      oval = e[0];
    } else {
      len = this.getStringLength(e);
      oval = e;
    }
    if (len > 150) return;
    val[type] = oval;
    infoData[type] = oval;
    isDefinedControl = false;
    if(billingStatus === 'CashSale')
      this.props.dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', { infoData: infoData }));
    this.props.reserveActions.setCommonData(val);
  }

  onChangeNum = (value, type, decimalDigits) => {
    const { infoData, billingStatus } = this.props.uretailHeader;
    const val = {};
    const dig = value.toString().split('.')[1];
    const digits = dig ? dig.length : 0;
    if (digits > (decimalDigits || 0)) {
      value = value.toFixed(decimalDigits);
    }
    val[type] = value;
    infoData[type] = value;
    if(billingStatus === 'CashSale')
      this.props.dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', { infoData: infoData }));
    this.props.reserveActions.setCommonData(val);
  }

  onDateChange = (date, dateString, type) => {
    const val = {};
    val[type] = dateString;
    this.props.reserveActions.setCommonData(val);
  }

  getDefined2Control (items) {
    const { reserve } = this.props;
    const tempDataSource = reserve[items.metaData.cSelfDefineType + '_DataSource'];
    const dateSource = [];
    if (tempDataSource) {
      tempDataSource.map((item, i) => {
        dateSource.push({ value: item.name, label: item.name });
        // if(data && item.code == data){
        //   data = { value: item.code, label: item.name };
        // }
      })
    }
    return dateSource;
  }

  define2Control = (item, i) => {
    const { reserve } = this.props;
    let control;
    const data = reserve[item.dataIndex];
    const cControlType = item.metaData.cControlType;

    // let tempDataSource = reserve[item.metaData.cSelfDefineType + '_DataSource'];
    const dateSource = this.getDefined2Control(item);
    // if (tempDataSource) {
    //   tempDataSource.map((item, i) => {
    //     dateSource.push({ value: item.name, label: item.name });
    //     // if(data && item.code == data){
    //     //   data = { value: item.code, label: item.name };
    //     // }
    //   })
    // }
    switch (cControlType && cControlType.trim().toLocaleLowerCase()) {
      case 'input':
        control = <InputItem key={i} onChange={e => this.onChange(e, item.dataIndex)} value={data} clear placeholder='请输入'>{item.cShowCaption}</InputItem>
        // control = <Input value={data} onChange={e => this.onChange(e, item.dataIndex)} placeholder="请输入" />
        break;
      case 'inputnumber':
        control = <InputItem key={i} type='digit' step={1} onChange={val => this.onChangeNum(val, item.dataIndex, item.metaData.iNumPoint)} value={data} clear placeholder='请输入'>{item.cShowCaption}</InputItem>
        // control = <InputNumber value={data} step={1} onChange={val => this.onChangeNum(val, item.dataIndex, item.metaData.iNumPoint)} placeholder="请输入" />
        break;
      case 'refer':
      case 'select':

        /** *control = (<div className={data ? '' : 'wuxuanze'}><Picker key={item.dataIndex} data={dateSource} value={[data]} cols={1} onOk={e => this.onChange(e, item.dataIndex)} onVisibleChange={(visible) => this.onDefineFocus(item.metaData.cSelfDefineType, visible)} onDismiss={e => this.onSelect('dismiss', 'waketype', e)}>
          <List.Item arrow="horizontal">{item.cShowCaption}</List.Item>
        </Picker></div>)****/

        control = (<div className={data ? '' : 'wuxuanze'}>
          <List.Item onClick={() => { this.onDefineFocus(item.metaData.cSelfDefineType, true); isDefinedControl = true; this.setState({isChooseBussiness: true, dataSource: dateSource, chooseId: data, typename: 'defineControl', custitle: '选择' + item.cShowCaption, cusItemIndex: item.dataIndex, cSelfDefineItem: item}) }} extra={data || '请选择'} arrow='horizontal'>{item.cShowCaption}</List.Item>
        </div>)

        // control = (
        //   <Select value={data} placeholder="请选择" onSelect={(value, options) => this.onSelect(value, options, item.dataIndex)} onFocus={() => this.onDefineFocus(item.metaData.cSelfDefineType)}>
        //     {this.getDefineRefControl(item.metaData.cSelfDefineType)}
        //   </Select>
        // )
        break;
      case 'datepicker':
        if (!item.metaData.cFormatDate || item.metaData.cFormatDate == 'YYYY-MM-DD')
          control = <DatePicker key={i} mode='date' title='' extra='Optional' value={data ? moment(data, 'YYYY-MM-DD') : ''}><List.Item arrow='horizontal'>{item.cShowCaption}</List.Item></DatePicker>
        //   control = <DatePicker allowClear value={data ? moment(data, 'YYYY-MM-DD') : ''} onChange={(date, dateString) => this.onDateChange(date, dateString, item.dataIndex)} placeholder="请选择" />
        if (item.metaData.cFormatDate == 'HH:mm:ss') {
          control = <DatePicker key={i} mode='time' title='' extra='Optional' value={data ? moment(data, 'YYYY-MM-DD') : ''}><List.Item arrow='horizontal'>{item.cShowCaption}</List.Item></DatePicker>
        } else if (item.metaData.cFormatDate == 'YYYY-MM-DD HH:mm:ss') {
          control = <DatePicker key={i} mode='datetime' title='' extra='Optional' value={data ? moment(data, 'YYYY-MM-DD') : ''}><List.Item arrow='horizontal'>{item.cShowCaption}</List.Item></DatePicker>
          //   control = <DatePicker format="YYYY-MM-DD HH:mm:ss" showTime allowClear value={data ? moment(data, 'YYYY-MM-DD HH:mm:ss') : ''} onChange={(date, dateString) => this.onDateChange(date, dateString, item.dataIndex)} placeholder="请选择" />
        }
        break;
    }
    return control;
  }

  /* 自定义项  显示栏目 */
  getDefineControl = () => {
    const dataSource = this.props.reserve.define_DataSource;
    const controls = [];
    dataSource.forEach(function (ele, i) {
      const control = this.define2Control(ele, i);
      controls.push(
        <div className='billing-points clearfix' key={i}>
          <span className='content'>
            {control}
          </span>
          <span className='err-info' />
        </div>
      )
    }, this);
    return controls;
  }

  onSelect (eventType, reserveType, value) {
    if (eventType === 'dismiss') {
      return;
    }
    if(reserveType === 'defineControl' && value) {
      this.onChange(value, this.state.cusItemIndex) // _.findIndex(this.state.dataSource,(item)=>{return item.value===value[0]})
      return;
    }
    const val = {};
    const { reserve, uretailHeader, reserveActions } = this.props;
    const infoData = uretailHeader.infoData;
    if (reserveType === 'bussType') {
      const businesstypeObj = reserve.Businesstype_DataSource.find((busTypeObj) => {
        if (busTypeObj.id === value[0]) {
          return busTypeObj;
        }
      });
      const businessTypeId = businesstypeObj.id;
      val.businessType = { id: businessTypeId, name: businesstypeObj.name };
      // let takeWay = {id:1,name:'门店自提'};
      const isDistribCenter = businesstypeObj.isDistribCenter;
      // if(isDistribCenter) takeWay = {id:2,name:'中心配送'};
      val.bDeliveryModify = businesstypeObj.isUpdItemBySend;
      val.bPreselllockStock = businesstypeObj.isPreCalcBalance;
      val.MinPercentGiveMoneyPre = businesstypeObj.MinPercentGiveMoneyPre;
      // val.takeWay = takeWay;
      let takeWay_DataSource = [];
      takeWay_DataSource = this.getTakeWayDataSource(isDistribCenter);
      val.takeWay_DataSource = takeWay_DataSource;
      if (takeWay_DataSource[0]) val.takeWay = takeWay_DataSource[0];
      val.isDistribCenter = isDistribCenter;
      if(uretailHeader.billingStatus === 'CashSale')
        infoData.businessType = val.businessType;
    } else if (reserveType === 'address') {
      const areaObj = tempRegion.find((a1) => {
        if (a1.id === value[0]) {
          return a1;
        }
      }).children.find((a1) => {
        if (a1.id === value[1]) {
          return a1;
        }
      }).children.find((a1) => {
        if (a1.id === value[2]) {
          return a1;
        }
      }).children.find((a1) => {
        if (a1.id === value[3]) {
          return a1;
        }
      })
      val.addressCascader = { id: value, name: areaObj.mergername };
      if(uretailHeader.billingStatus === 'CashSale')
        infoData.addressCascader = val.addressCascader;
    } else if (reserveType === 'waketype') {
      const takeWayObj = reserve.takeWay_DataSource.find((tWayObj) => {
        if (tWayObj.id === value[0]) {
          return tWayObj;
        }
      });
      val.takeWay = takeWayObj;
      if(uretailHeader.billingStatus === 'CashSale')
        infoData.takeWay = val.takeWay;
    } else if (reserveType === 'reserveDate') {
      val.ReserveDeliveryDate = dateFormat(value, 'yyyy-MM-dd HH:mm:ss');
      if(uretailHeader.billingStatus === 'CashSale')
        infoData.reserveDate = val.ReserveDeliveryDate;
    }else if(reserveType === 'customertype') {
      const customerObj = reserve.customer_DataSource.find((cusObj) => {
        if (cusObj.id === value[0]) {
          return cusObj;
        }
      });
      val.iCustomerid = customerObj.id;
      val.iCustomerName = customerObj.name;
      if(uretailHeader.billingStatus === 'CashSale') {
        infoData.iCustomerid = val.iCustomerid;
        infoData.iCustomerName = val.iCustomerName;
      }
    }
    if(uretailHeader.billingStatus === 'CashSale')
      this.props.dispatch(genAction('PLATFORM_UI_BILLING_HEADER_SET_COMMONDATA', { infoData: infoData }));
    reserveActions.setCommonData(val);
  }

  getReserveControl () {
    const { reserve, reserveActions } = this.props;
    const { takeWay, wareHouse, WareHouse_DataSource } = reserve;
    if (cb.utils.isEmpty(wareHouse.name) && WareHouse_DataSource.length > 0) {
      const val = {};
      val.wareHouse = WareHouse_DataSource[0]
      reserveActions.setCommonData(val);
    }
    return (
      <div>
        {
          takeWay.id === '2' ? <List.Item extra={wareHouse.name} arrow='horizontal' onClick={this.onWareHouseClick}>交货仓库</List.Item> : ''
        }
      </div>
    )
  }

  getAddReserveUI () {
    let { isChooseBussiness, dataSource, chooseId, typename, custitle, cSelfDefineItem } = this.state;
    const { uretailHeader, reserve, location } = this.props;
    let { Businesstype_DataSource, businessType, addressCascader, takeWay_DataSource, iCustomerid, iCustomerName, customer_DataSource, takeWay, Region_DataSource, ReserveDeliveryDate, Phone, Contacts, Address, Memo } = reserve;
    const infoData = this.props.infoData.toJS();
    if (Businesstype_DataSource && Businesstype_DataSource.length > 0) {
      Businesstype_DataSource.map(function (busType) {
        busType.label = busType.name;
        busType.value = busType.id;
      });
    }
    if (customer_DataSource && customer_DataSource.length > 0) {
      customer_DataSource.map(function (customer) {
        customer.label = customer.name;
        customer.value = customer.id;
      });
    }
    if (takeWay_DataSource && takeWay_DataSource.length > 0) {
      takeWay_DataSource.map(function (takeWayObj) {
        takeWayObj.label = takeWayObj.name;
        takeWayObj.value = takeWayObj.id;
      });
    }
    ReserveDeliveryDate = ReserveDeliveryDate.replace(/-+/g, '/');
    const tempReserveDate = new Date(ReserveDeliveryDate);
    let btnName = '保存';
    if (location.state) {
      btnName = '保存并结算'
    }
    if (Region_DataSource && Region_DataSource.length > 0) {
      Region_DataSource.map((obj) => {
        this.getArea(obj);
      });
      tempRegion = Region_DataSource;
    }
    if(isDefinedControl) {
      dataSource = this.getDefined2Control(cSelfDefineItem);
    }
    return (
      <List className='my-list edit-yd-list fixed_height_cls'>
        <div style={{ paddingBottom: '1.3rem' }}>
          {/* <Picker cols={1} data={Businesstype_DataSource} value={[businessType.id]} onOk={e => this.onSelect('ok', 'bussType', e)} onDismiss={e => this.onSelect('dismiss', 'bussType', e)}> */}
          <List.Item onClick={() => this.setState({isChooseBussiness: true, dataSource: Businesstype_DataSource, chooseId: businessType.id, typename: 'bussType', custitle: '选择业务类型'})} extra={businessType.id ? businessType.name : '请选择'} arrow='horizontal'>业务类型<i>*</i></List.Item>
          {/* </Picker> */}
          <CusRefer title={custitle} id={chooseId} isShow={(dataSource && dataSource.length > 0) && isChooseBussiness} data={dataSource} close={() => { this.setState({isChooseBussiness: false}); isDefinedControl = false; }} ok={(item) => { this.onSelect('ok', typename, [item.value]); this.setState({isChooseBussiness: false}) }} />
          {uretailHeader.billingStatus === 'PresellBill' ? (<div>
            {/* <Picker data={takeWay_DataSource} value={[takeWay.id]} cols={1} onOk={e => this.onSelect('ok', 'waketype', e)} onDismiss={e => this.onSelect('dismiss', 'waketype', e)}> */}
            <List.Item onClick={() => this.setState({isChooseBussiness: true, dataSource: takeWay_DataSource, chooseId: takeWay.id, typename: 'waketype', custitle: '选择提货方式'})} extra={takeWay.id ? takeWay.name : '请选择'} arrow='horizontal'>提货方式<i>*</i></List.Item>
            {/* </Picker> */}
            {
              this.getReserveControl()
            }
            <DatePicker title='' extra='Optional' value={tempReserveDate} onOk={this.onSelect.bind(this, 'ok', 'reserveDate')}>
              <List.Item arrow='horizontal'>交货日期</List.Item>
            </DatePicker>
            <InputItem onChange={this.inputChange.bind(this, 'Contacts')} value={Contacts} clear placeholder='请输入'>联系人</InputItem>
            <InputItem onChange={this.inputChange.bind(this, 'Phone')} value={Phone} clear placeholder='请输入'>联系人手机</InputItem>
            <div className={cb.utils.isEmpty(addressCascader.id) ? 'gray' : ''}>
              <Picker data={tempRegion} value={addressCascader.id} cols={4} onOk={e => this.onSelect('ok', 'address', e)} onDismiss={e => this.onSelect('dismiss', 'address', e)}>
                <List.Item arrow='horizontal'>收货地址</List.Item>
              </Picker>
              {/* <List.Item extra={addressCascader.id} arrow="horizontal" onClick={()=>{dispatch(push('/region'))}}>收货地址</List.Item> */}
            </div>

            <TextareaItem autoHeight rows={2} onChange={this.inputChange.bind(this, 'Address')} value={Address} placeholder='请输入' title='详细地址' />
            {/* <InputItem onChange={this.inputChange.bind(this,'Address')} value={Address} clear placeholder={'请输入'} >详细地址</InputItem> */}
            {/* <Picker data={[{label:'请选择',value:'请选择'},{label:'仓库1',value:'仓库1'},{label:'仓库2',value:'仓库2'}]} value={['仓库1']} onOk={e=>console.log('ok',e)} onDismiss={e=>console.log('dismiss',e)}>
                        <List.Item arrow="horizontal">提货方式</List.Item>
                    </Picker> */}
          </div>) : <List.Item onClick={() => { if(customer_DataSource.length <= 0) { cb.utils.alert('暂无可选客户', 'error'); return; }this.setState({isChooseBussiness: true, dataSource: customer_DataSource, chooseId: (infoData.iCustomerid || iCustomerid), typename: 'customertype', custitle: '选择客户'}) }} extra={iCustomerName || '请选择'} arrow='horizontal'>客户<i>*</i></List.Item>}
          <TextareaItem autoHeight rows={2} onChange={this.inputChange.bind(this, 'Memo')} value={Memo} placeholder='请输入' title='备注' />
          {/* <InputItem onChange={this.inputChange.bind(this,'Memo')} value={Memo} clear placeholder={'请输入'} >备注</InputItem> */}
          {this.getDefineControl()}
        </div>
        <div className='button-fixed-bottom'><Button style={{ color: '#000' }} onClick={this.handleOk.bind(this)} type='warning'>{btnName}</Button></div>
      </List>
    );
  }

  render () {
    const { reserveActions, dispatch } = this.props;
    return (<div className='billing-refer fixed-top'>
      <NavBar onLeftClick={() => { reserveActions.setReserveIsEdit({ isEdited: true }); dispatch(goBack()); }} title={this.props.uretailHeader.billingStatus === 'CashSale' ? '修改单据信息' : '修改预订信息'} />
      {this.getAddReserveUI()}
    </div>
    );
  }
}

function mapStateToProps (state) {
  return {
    user: state.user.toJS(),
    reserve: state.reserve.toJS(),
    editRow: state.editRow.toJS(),
    uretailHeader: state.uretailHeader.toJS(),
    product: state.product.toJS(),
    paymode: state.paymode.toJS(),
    member: state.member.toJS(),
    infoData: state.uretailHeader.get('infoData'),
  };
}

function mapDispatchToProps (dispatch) {
  return {
    setPresellMoney: bindActionCreators(setPresellMoney, dispatch),
    reserveActions: bindActionCreators(reserveActions, dispatch),
    // editRowActions: bindActionCreators(editRowActions, dispatch),
    billingRefer: bindActionCreators(billingRefer, dispatch),
    dispatch,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EditReserve)
