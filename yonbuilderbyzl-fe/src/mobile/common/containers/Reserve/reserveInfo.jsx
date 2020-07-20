import React, { Component } from 'react';
import {connect} from 'react-redux';
import { bindActionCreators } from 'redux';
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar';
import * as reserveActions from 'src/common/redux/modules/billing/reserve';
import { List } from 'antd-mobile';
import { goBack } from 'react-router-redux'
import * as billingRefer from '../../reducers/modules/billingRefer'
import { getDelZeroResult, handleSettlePayment } from 'src/common/redux/modules/billing/paymode'
// import * as editRowActions from '../../reducers/modules/editRow';
import _ from 'lodash'

const Item = List.Item;
const nowTimeStamp = Date.now();
const now = new Date(nowTimeStamp);
class ReserveInfo extends Component {
  constructor (props) {
    super(props);
    this.state = {
      date: now,
      areas: [],
      vals: {},
      address: {label: '', value: ''}
    };
    this.check = false;
  }

  componentWillMount () {
    this.init();
    // this.props.reserveActions.getBusinessType(true,"",true);
  }

  init () {
    // this.props.editRowActions.initEditRow(0);
    if(this.state.vals.businessType) {
      return;
    }
    const {uretailHeader, reserveActions, reserve} = this.props;
    const { businessType, takeWay } = reserve;
    if(cb.utils.isEmpty(businessType) && cb.utils.isEmpty(takeWay)) {
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
      reserveActions.setCommonData(val);
    }else{
      // if(cb.utils.isEmpty(businessType.id) || cb.utils.isEmpty(businessType.name)){
      //     businessType = Businesstype_DataSource[0];
      // }
      // this.setBussinessType(businessType);
    }
  }

  componentDidMount () {
    const {Region_DataSource} = this.props.reserve;
    Region_DataSource.map((obj) => {
      this.getArea(obj);
    });
    this.setState({areas: Region_DataSource});
  }

  getArea (obj) {
    obj.label = obj.shortname;
    obj.value = obj.id;
    if(obj.children && obj.children.length > 0) {
      obj.children.map((objchild) => {
        this.getArea(objchild);
      });
    }
  }

  setBussinessType (businessType) {
    if(!businessType) return;
    const { takeWay } = this.props.reserve;
    const vals = this.state.vals;
    vals.businessType = businessType;
    if(businessType.isDistribCenter) {
      vals.takeWay = {id: 2, name: '中心配送'};
    }else{
      vals.takeWay = takeWay;
    }
    this.setState({vals: vals});
  }

  inputChange (type, value) {
    const {reserveActions} = this.props;
    const val = {};
    val[type] = value;
    reserveActions.setCommonData(val);
  }

    handleOk = () => {
      const { reserve, reserveActions, dispatch, location } = this.props;
      const businessTypeId = reserve.businessType.id;
      if (!businessTypeId || businessTypeId == '') {
        reserveActions.setCommonData({ check: true });
        return;
      }
      reserveActions.setReserveIsEdit({isEdited: true});
      reserveActions.modify();
      reserveActions.setVisible(false);
      reserveActions.setCommonData({ check: false });
      if(location.state) {
        const {products } = this.props.product;
        const {billingStatus} = this.props.uretailHeader;
        const { currentPayment, payment} = this.props.paymode;
        const { memberInfo, bHasMember} = this.props.member;
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
      }else{
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
        if (data == '2') takeWay_DataSource.push({ id: data, name: '本店配送' });
        if (data == '3' && storeType != '2' && storeType != '3') takeWay_DataSource.push({ id: data, name: '中心配送' });
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

    onDefineFocus = (cSelfDefineType) => {
      this.props.reserveActions.getDefineRefById(cSelfDefineType);
    }

    onChange = (e, type) => {
      const val = {};
      const len = this.getStringLength(e.target.value);
      if (len > 150) return;
      val[type] = e.target.value;
      this.props.reserveActions.setCommonData(val);
    }

    onChangeNum = (value, type, decimalDigits) => {
      const val = {};
      const dig = value.toString().split('.')[1];
      const digits = dig ? dig.length : 0;
      if (digits > (decimalDigits || 0)) {
        value = value.toFixed(decimalDigits);
      }
      val[type] = value;
      this.props.reserveActions.setCommonData(val);
    }

    onDateChange = (date, dateString, type) => {
      const val = {};
      val[type] = dateString;
      this.props.reserveActions.setCommonData(val);
    }

    /* 自定义项  显示栏目 */
    getDefineControl = () => {
      const { reserve } = this.props;
      const dataSource = this.props.reserve.define_DataSource;
      const controls = [];
      dataSource.forEach(function (ele, i) {
        controls.push(
          <div className='billing-points clearfix' key={i}>
            <span className='content'>
              {
                cb.utils.isEmpty(reserve[ele.dataIndex]) ? '' : (
                  <Item extra={reserve[ele.dataIndex]}>{ele.cShowCaption}</Item>
                )
              }
            </span>
            <span className='err-info' />
          </div>
        )
      }, this);
      return controls;
    }

    onSelect (eventType, reserveType, value) {
      if(eventType === 'dismiss') {
        return;
      }
      const val = {};
      const {reserve, reserveActions} = this.props;
      if(reserveType === 'bussType') {
        const businesstypeObj = reserve.Businesstype_DataSource.find((busTypeObj) => {
          if(busTypeObj.id === value[0]) {
            return busTypeObj;
          }
        });
        const businessTypeId = businesstypeObj.id;
        val.businessType = {id: businessTypeId, name: businesstypeObj.name};
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
      }else if(reserveType === 'address') {
        const areaObj = this.state.areas.find((a1) => {
          if(a1.id === value[0]) {
            return a1;
          }
        }).children.find((a1) => {
          if(a1.id === value[1]) {
            return a1;
          }
        }).children.find((a1) => {
          if(a1.id === value[2]) {
            return a1;
          }
        }).children.find((a1) => {
          if(a1.id === value[3]) {
            return a1;
          }
        })
        val.addressCascader = {id: value, name: areaObj.mergername};
      }else if(reserveType === 'waketype') {
        const takeWayObj = reserve.takeWay_DataSource.find((tWayObj) => {
          if(tWayObj.id === value[0]) {
            return tWayObj;
          }
        });
        val.takeWay = takeWayObj;
      }
      reserveActions.setCommonData(val);
    }

    getReserveControl () {
      const { uretailHeader, reserve, reserveActions } = this.props;
      const { takeWay, wareHouse, WareHouse_DataSource } = reserve;
      if(cb.utils.isEmpty(wareHouse.name) && WareHouse_DataSource.length > 0) {
        const val = {};
        val.wareHouse = WareHouse_DataSource[0]
        reserveActions.setCommonData(val);
      }
      return (
        <div>
          {
            takeWay.id === '3' ? <List.Item extra={uretailHeader.warehouse.name} arrow='horizontal'>交货仓库</List.Item> : ''
          }
        </div>
      )
    }

    getAddReserveUI () {
      const { uretailHeader, reserve} = this.props;
      const { Businesstype_DataSource, takeWay_DataSource } = reserve;
      if(Businesstype_DataSource && Businesstype_DataSource.length > 0) {
        Businesstype_DataSource.map(function (busType) {
          busType.label = busType.name;
          busType.value = busType.id;
        });
      }
      if(takeWay_DataSource && takeWay_DataSource.length > 0) {
        takeWay_DataSource.map(function (takeWayObj) {
          takeWayObj.label = takeWayObj.name;
          takeWayObj.value = takeWayObj.id;
        });
      }
      // let tempReserveDate = new Date(ReserveDeliveryDate);
      return (
        <List className='my-list edit-yd-list'>
          <Item extra={uretailHeader.infoData.businessType.name}>业务类型<i>*</i></Item>
          <Item extra={uretailHeader.infoData.takeWay.name}>提货方式<i>*</i></Item>
          {
            this.getReserveControl()
          }
          {
            cb.utils.isEmpty(uretailHeader.infoData.reserveDate) ? '' : (
              <Item extra={uretailHeader.infoData.reserveDate}>交货日期</Item>
            )
          }
          {
            cb.utils.isEmpty(uretailHeader.infoData.contacts) ? '' : (
              <Item extra={uretailHeader.infoData.contacts}>联系人</Item>
            )
          }
          {
            cb.utils.isEmpty(uretailHeader.infoData.phone) ? '' : (
              <Item extra={uretailHeader.infoData.phone}>联系人手机</Item>
            )
          }
          {
            cb.utils.isEmpty(uretailHeader.infoData.address) ? '' : (
              <Item extra={uretailHeader.infoData.address}>收货地址</Item>
            )
          }
          {
            cb.utils.isEmpty(uretailHeader.infoData.memo) ? '' : (
              <Item extra={uretailHeader.infoData.memo}>详细地址</Item>
            )
          }
          {
            cb.utils.isEmpty(uretailHeader.infoData.memo) ? '' : (
              <Item extra={uretailHeader.infoData.memo}>备注</Item>
            )
          }
          {this.getDefineControl()}
        </List>
      );
    }

    render () {
      // let { reserveActions,dispatch } =this.props;
      return (<div>
        <NavBar title='预订信息详情' />
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
    member: state.member.toJS()
  };
}

function mapDispatchToProps (dispatch) {
  return {
    reserveActions: bindActionCreators(reserveActions, dispatch),
    // editRowActions:bindActionCreators(editRowActions,dispatch),
    billingRefer: bindActionCreators(billingRefer, dispatch),
    dispatch,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ReserveInfo)
