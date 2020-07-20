import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { push, goBack } from 'react-router-redux'
import { List, InputItem, Button, DatePicker, TextareaItem, Modal } from 'antd-mobile';
import * as actions from 'src/common/redux/modules/billing/editRow';
import { handleCancel, showModal, checkShowModal, handleOk } from 'src/common/redux/modules/billing/actions';
import * as discountActions from 'src/common/redux/modules/billing/discount';
import { salesOk } from 'src/common/redux/modules/billing/salesClerk';
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar';
// import Operator from './Operator';
import { dateFormat } from '@mdf/cube/lib/helpers/formatDate';
import BackReason from './BackBill/BackReason';
import * as quoteActions from 'src/common/redux/modules/billing/quote';

let tempfQuotePrice = 0;
class EditRow extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor (props) {
    super(props);
    this.actions = props.actions;
    this.focusKey = null;
    this.isIos = cb.utils.isIos();
  }

  componentDidMount () {
    const params = this.props.match.params;
    let rowIndex = 0;
    if (params && params.rowIndex) rowIndex = params.rowIndex;
    this.props.discountActions.setData({ activeKey: 'dhzk', doneActiveKey: 'dhzk', focusKey: '' });
    this.actions.initData(rowIndex);
    this.actions.getStoreWareHouse();
    this.actions.getSnData();
    this.props.quoteActions.InitQuote();
    this.props.discountActions.initDiscount();
  }

  componentWillReceiveProps (nextProps) {
    const nextModalKey_Current = nextProps.actionState.modalKey_Current;
    const nowModalKey_Current = this.props.actionState.modalKey_Current;
    if (nextModalKey_Current == 'SceneDiscount') {
      if (nextModalKey_Current != nowModalKey_Current) {
        Modal.prompt('改折扣率', null, [
          { text: '取消', onPress: () => { this.props.handleCancel() } },
          { text: '保存', onPress: value => this.onBlur(value, 'fSceneDiscountRate') }],
        'default', nextProps.discount.dhData.discount)
      }
    }
    if (nextModalKey_Current == 'ModifyPrice') {
      if (nextModalKey_Current != nowModalKey_Current) {
        Modal.prompt('改零售价', null, [
          { text: '取消', onPress: () => { this.props.handleCancel() } },
          { text: '保存', onPress: value => this.onBlur(value, 'fQuotePrice') }],
        'default', nextProps.quote.value)
      }
    }
  }

  /* 返回 */
  onGoBack = () => {
    this.props.handleCancel('EditRow');
    this.actions.cancelCheck();
    this.props.dispatch(goBack());
  }

  /* 营业员 */
  onOperatorClick = () => {
    if (this.actions.showSalesList()) {
      this.props.dispatch(push('/billingRefer'));
    }
  }

  /* 批号 */
  onBatchNoClick = (e, disabled) => {
    if (disabled) return;
    this.props.dispatch(push('/billingRefer'));
    this.actions.befoeBatchRefer();
  }

  /* 序列号 */
  onSNClick = (e, disabled) => {
    if (disabled) return;
    this.props.dispatch(push('/billingRefer'));
    this.actions.befoeSNRefer();
  }

  // onSnChange
  /* 仓库 */
  onWareHouseClick = () => {
    this.props.dispatch(push('/billingRefer'));
    this.actions.beforeWareHouseRefer();
  }

  /* blur事件   零售价/折扣率 */
  onBlur = (val, type) => {
    this.focusKey = null;
    if (type == 'fQuotePrice') { /* 零售价 */
      const callback = () => {
        this.actions.initData();
      }
      this.props.quoteActions.exec(val, callback);
    } else { /* 折扣率 */
      if (val == 100) {
        this.props.discountActions.cancelDiscount();
        return;
      }
      const dhData = this.props.discount.dhData;
      if (!val || val == '') {
        dhData.discount = 100;
        this.props.discountActions.setData({ dhData });
        return
      } else {
        dhData.zhPrices = parseFloat(dhData.dqPrices * val / 100).toFixed(cb.rest.AppContext.option.amountofdecimal);
        dhData.discount = parseFloat(val).toFixed(2);
        dhData.bdPrices = parseFloat(dhData.zhPrices * dhData.quantity).toFixed(cb.rest.AppContext.option.amountofdecimal);
        this.props.discountActions.setData({ dhData });
      }
      this.props.discountActions.exec();
    }
  }

  /* 折扣率 更改 */
  onSceneChange = (val) => {
    if (val > 100) return;
    const dhData = this.props.discount.dhData;
    dhData.discount = val;
    this.props.discountActions.setData({ dhData: dhData });
  }

  onChange = (val, cItemName) => {
    if (cItemName == 'fQuotePrice') {
      this.props.quoteActions.changeValue(val);
      return;
    }
    const { rowData } = this.props.editRow;
    if (cItemName == 'cMemo') {
      const len = this.getStringLength(val);
      if (len > 150) return;
    }
    rowData[cItemName] = val;
    this.actions.setEditRowData(rowData);
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

  /* 日期类型 改变事件 */
  onDateChange = (date, cItemName) => {
    if (cItemName == 'invaliddate' || cItemName == 'producedate') {
      this.actions.checkInvaliddate(date, cItemName);
    } else {
      const { rowData } = this.props.editRow;
      rowData[cItemName] = dateFormat(date, 'yyyy-MM-dd HH:mm:ss');
      this.actions.setEditRowData(rowData);
    }
  }

  /* 参照型 自定义项 */
  onDefineReferClick = (e, cSelfDefineType, cItemName, bCanModify) => {
    // if (!bCanModify) return;s
    this.actions.getDefineRefById(cSelfDefineType, cItemName);
    this.props.dispatch(push('/billingRefer'));
  }

  /* 确定 */
  onOk = () => {
    this.props.handleOk('EditRow');
    // this.props.dispatch(goBack());
  }

  /* 自定义项 */
  getDefineControl = (dataSource) => {
    const controls = [];
    dataSource.forEach(function (ele) {
      const control = this.define2Control(ele);
      controls.push(control);
    }, this);
    return controls;
  }

  define2Control = (item) => {
    const { define2Meta, rowData } = this.props.editRow;
    const meta = define2Meta[item.variable];
    if (!rowData) return;
    const data = rowData[item.dataIndex];
    let control; const cControlType = item.metaData.cControlType;
    let disabled = !meta.bCanModify;
    const cDataSourceName = item.metaData.cDataSourceName;
    /* 如果是批次自定义项   根据现销/交货 还是退货  控制是否可编辑 */
    if (cDataSourceName && cDataSourceName.indexOf('RetailVouchDetailBatch') != -1) {
      const billingStatus = this.props.uretailHeader.billingStatus;
      if (billingStatus == 'CashSale' || billingStatus == 'Shipment') disabled = true;
      if (!rowData.product_productOfflineRetail_isBatchManage) disabled = true;
    }

    switch (cControlType && cControlType.trim().toLocaleLowerCase()) {
      case 'input':
        control = (
          <InputItem disabled={disabled} value={data}
            placeholder={!disabled ? '请输入' : ''}
            onChange={e => this.onChange(e, item.dataIndex)}>
            {item.name}
          </InputItem>
        )
        break;
      case 'inputnumber':
        control = (
          <InputItem type='number' disabled={disabled} value={data}
            placeholder={!disabled ? '请输入' : ''}
            onChange={e => this.onChange(e, item.dataIndex)}>
            {item.name}
          </InputItem>
        )
        break;
      case 'refer':
      case 'select': {
        const cSelfDefineType = item.metaData.cSelfDefineType;
        control = (
          <List.Item disabled={disabled} extra={typeof data == 'object' ? data.name : data} arrow='horizontal' onClick={e => !this.isReservestatus() ? '' : this.onDefineReferClick(e, cSelfDefineType, item.dataIndex, meta.bCanModify)}>
            {item.name}
          </List.Item>
        )
        break;
      }
      case 'datepicker':
        if (!item.metaData.cFormatDate || item.metaData.cFormatDate == 'YYYY-MM-DD') {
          control = <DatePicker disabled={disabled} value={data} mode='date'
            onChange={date => this.onDateChange(date, item.dataIndex)}
          >
            <List.Item arrow='horizontal'>{item.name}</List.Item>
          </DatePicker>
        } else if (item.metaData.cFormatDate == 'HH:mm:ss') {
          control = <DatePicker disabled={disabled} value={data} mode='time'
            onChange={date => this.onDateChange(date, item.dataIndex)}
          >
            <List.Item arrow='horizontal'>{item.name}</List.Item>
          </DatePicker>
        } else {
          control = <DatePicker disabled={disabled} value={data} mode='datetime'
            onChange={date => this.onDateChange(date, item.dataIndex)}
          >
            <List.Item arrow='horizontal'>{item.name}</List.Item>
          </DatePicker>
        }
        break;
    }
    return control;
  }

  isReservestatus () {
    const { billingStatus, infoData } = this.props.uretailHeader;
    if (billingStatus === 'Shipment') {
      return infoData.bDeliveryModify;
    }
    return true;
  }

  getSnControl = (billingStatus, rowData, isSerialNoManage, snNoData) => {
    if (!isSerialNoManage) return null;
    if (snNoData)
      return (
        <InputItem value='无'
          disabled>
          序列号<span>*</span>
        </InputItem>
      )
    if (billingStatus == 'FormerBackBill') {
      if (rowData.fQuantity < 0) { /* 退货行 */
        return (
          <List.Item extra={rowData.cBatchno ? rowData.cBatchno : ''} arrow='horizontal' disabled={true}>
            序列号<span>*</span>
          </List.Item>
        )
      }
    } else if (billingStatus == 'NoFormerBackBill' || billingStatus == 'OnlineBackBill') {
      if (rowData.fQuantity < 0 && isSerialNoManage) { /* 退货行 */
        return (
          <InputItem value={rowData.cBatchno ? rowData.cBatchno : ''}
            onChange={this.onSnChange}>
            序列号<span>*</span>
          </InputItem>
        )
      }
    }
    return (
      <List.Item extra={rowData.cSerialNo ? rowData.cSerialNo : <span className='pleaseSelect'>请选择</span>} arrow='horizontal' disabled={!isSerialNoManage}
        onClick={e => this.onSNClick(e, !isSerialNoManage)}>
        序列号<span>*</span>
      </List.Item>
    )
  }

  getBatchControl = (billingStatus, rowData, isBatchManage, batchNoData) => {
    let batchControl = null;
    if (!isBatchManage) return null;
    if (batchNoData)
      return (
        <InputItem value='无'
          disabled>
          批号<span>*</span>
        </InputItem>
      )
    switch (billingStatus) {
      case 'FormerBackBill':/* 原单退货 */
        if (rowData.fQuantity < 0) { /* 退货行  迈宇佳说原单退货固定不允许修改批号 */
        }
        batchControl = <List.Item extra={rowData.cBatchno ? rowData.cBatchno : <span className='pleaseSelect'>请选择</span>} arrow='horizontal' disabled={!isBatchManage}
          onClick={e => this.onBatchNoClick(e, (rowData.fQuantity < 0) ? true : !isBatchManage)}>
          批号<span>*</span>
        </List.Item>
        break;
      case 'OnlineBackBill':/* 电商退货 */
      case 'NoFormerBackBill':/* 非原单退货 */
        if (rowData.fQuantity < 0) { /* 退货行 */
        }
        batchControl = <List.Item extra={rowData.cBatchno ? rowData.cBatchno : <span className='pleaseSelect'>请选择</span>} arrow='horizontal' disabled={!isBatchManage}
          onClick={e => this.onBatchNoClick(e, !isBatchManage)}>
          批号<span>*</span>
        </List.Item>
        break;
      default:
        batchControl = <List.Item extra={rowData.cBatchno ? rowData.cBatchno : <span className='pleaseSelect'>请选择</span>} arrow='horizontal' disabled={!isBatchManage}
          onClick={e => this.onBatchNoClick(e, !isBatchManage)}>
          批号<span>*</span>
        </List.Item>
        break;
    }
    return batchControl;
  }

  getExpiryDateControl = (billingStatus, rowData, isExpiryDateManage, batchNoData, isBatchBack) => {
    let expiryControl = null;
    if (!isBatchBack) isExpiryDateManage = false;
    if (!isExpiryDateManage) return null;
    if (batchNoData) {
      return <InputItem value='无'
        disabled>
        有效期至<span>*</span>
      </InputItem>
    }
    let invaliddate = rowData.invaliddate;
    if (this.isIos && invaliddate)
      invaliddate = invaliddate.replace(/-/g, '/')
    switch (billingStatus) {
      case 'CashSale':/* 现销 */
      case 'Shipment':/* 交货 */
      case 'PresellBack':/* 退订 */
      case 'PresellBill':/* 预定 */
        expiryControl = (
          <InputItem value={rowData.invaliddate ? dateFormat(new Date(invaliddate), 'yyyy-MM-dd') : ''}
            disabled>
            有效期至<span>*</span>
          </InputItem>
        )
        break;
      case 'FormerBackBill':/* 原单退货 */
        if (rowData.fQuantity < 0) { /* 退货行 */
          expiryControl = <DatePicker mode='date' disabled value={new Date(invaliddate || new Date())}
            onChange={date => this.onDateChange(date, 'invaliddate')}
          >
            <List.Item arrow='horizontal'>有效期至<span>*</span></List.Item>
          </DatePicker>
        } else {
          expiryControl = <DatePicker mode='date' disabled value={new Date(invaliddate || new Date())}
            onChange={date => this.onDateChange(date, 'invaliddate')}
          >
            <List.Item arrow='horizontal'>有效期至<span>*</span></List.Item>
          </DatePicker>
        }
        break;
      case 'NoFormerBackBill':/* 非原单退货 */
        if (rowData.fQuantity < 0) { /* 退货行 */
          expiryControl = <DatePicker mode='date' disabled={!isExpiryDateManage} value={new Date(invaliddate || new Date())}
            onChange={date => this.onDateChange(date, 'invaliddate')}
          >
            <List.Item arrow='horizontal'>有效期至<span>*</span></List.Item>
          </DatePicker>
        } else {
          expiryControl = <DatePicker mode='date' disabled value={new Date(invaliddate || new Date())}
            onChange={date => this.onDateChange(date, 'invaliddate')}
          >
            <List.Item arrow='horizontal'>有效期至<span>*</span></List.Item>
          </DatePicker>
        }
        break;
      case 'OnlineBackBill':
        expiryControl = <DatePicker mode='date' disabled={!isExpiryDateManage} value={new Date(invaliddate || new Date())}
          onChange={date => this.onDateChange(date, 'invaliddate')}
        >
          <List.Item arrow='horizontal'>有效期至<span>*</span></List.Item>
        </DatePicker>
        break;
      case 'OnlineBill':
        expiryControl = <DatePicker mode='date' disabled value={new Date(invaliddate || new Date())}
          onChange={date => this.onDateChange(date, 'invaliddate')}
        >
          <List.Item arrow='horizontal'>有效期至<span>*</span></List.Item>
        </DatePicker>
        break;

      default:
        break;
    }
    return expiryControl;
  }

  getproduceDateControl = (billingStatus, rowData, isExpiryDateManage, batchNoData, isBatchBack) => {
    let expiryControl = null;
    if (!isBatchBack) isExpiryDateManage = false;
    if (!isExpiryDateManage) return null;
    if (batchNoData) {
      return <InputItem value='无'
        disabled>
        有效期至<span>*</span>
      </InputItem>
    }
    let producedate = rowData.producedate;
    if (this.isIos && producedate)
      producedate = producedate.replace(/-/g, '/')
    switch (billingStatus) {
      case 'CashSale':/* 现销 */
      case 'Shipment':/* 交货 */
      case 'PresellBack':/* 退订 */
      case 'PresellBill':/* 预定 */
        expiryControl = (
          <InputItem value={producedate ? dateFormat(new Date(producedate), 'yyyy-MM-dd') : ''}
            disabled>
            生产日期<span>*</span>
          </InputItem>
        )
        break;
      case 'FormerBackBill':/* 原单退货 */
        if (rowData.fQuantity < 0) { /* 退货行 */
          expiryControl = <DatePicker mode='date' disabled value={new Date(producedate || new Date())}
            onChange={date => this.onDateChange(date, 'producedate')}
          >
            <List.Item arrow='horizontal'>生产日期<span>*</span></List.Item>
          </DatePicker>
        } else {
          expiryControl = <DatePicker mode='date' disabled value={new Date(producedate || new Date())}
            onChange={date => this.onDateChange(date, 'producedate')}
          >
            <List.Item arrow='horizontal'>生产日期<span>*</span></List.Item>
          </DatePicker>
        }
        break;
      case 'NoFormerBackBill':/* 非原单退货 */
        if (rowData.fQuantity < 0) { /* 退货行 */
          expiryControl = <DatePicker mode='date' disabled={!isExpiryDateManage} value={new Date(producedate || new Date())}
            onChange={date => this.onDateChange(date, 'producedate')}
          >
            <List.Item arrow='horizontal'>生产日期<span>*</span></List.Item>
          </DatePicker>
        } else {
          expiryControl = <DatePicker mode='date' disabled value={new Date(producedate || new Date())}
            onChange={date => this.onDateChange(date, 'producedate')}
          >
            <List.Item arrow='horizontal'>生产日期<span>*</span></List.Item>
          </DatePicker>
        }
        break;
      case 'OnlineBackBill':
        expiryControl = <DatePicker mode='date' disabled={!isExpiryDateManage} value={new Date(producedate || new Date())}
          onChange={date => this.onDateChange(date, 'producedate')}
        >
          <List.Item arrow='horizontal'>生产日期<span>*</span></List.Item>
        </DatePicker>
        break;
      case 'OnlineBill':
        expiryControl = <DatePicker mode='date' disabled value={new Date(producedate || new Date())}
          onChange={date => this.onDateChange(date, 'producedate')}
        >
          <List.Item arrow='horizontal'>生产日期<span>*</span></List.Item>
        </DatePicker>
        break;

      default:
        break;
    }
    return expiryControl;
  }

  getBaseControl = () => {
    const { rowData, Available, Define_DataSource, Batch_DataSource, SN_DataSource, isBatchBack } = this.props.editRow;
    const { billingStatus } = this.props.uretailHeader;
    const { value } = this.props.quote;
    const { dhData } = this.props.discount;
    const salesChecked = this.props.salesClerk.salesChecked;
    const defineControl = this.getDefineControl(Define_DataSource);
    const options = cb.rest.AppContext.option;
    const monovalentdecimal = options.monovalentdecimal;/* 单价小数位 */
    /* 是否批次效期序列号管理 */
    const isBatchManage = rowData.product_productOfflineRetail_isBatchManage;
    const isExpiryDateManage = rowData.product_productOfflineRetail_isExpiryDateManage;
    const isSerialNoManage = rowData.product_productOfflineRetail_isSerialNoManage;
    /* 无批号数据时  显示无 */
    let batchNoData = false; let snNoData = false;
    if (!Batch_DataSource || Batch_DataSource.length == 0) batchNoData = true;
    if (!SN_DataSource || SN_DataSource.length == 0) snNoData = true;
    const batchControl = this.getBatchControl(billingStatus, rowData, isBatchManage, batchNoData);
    const snControl = this.getSnControl(billingStatus, rowData, isSerialNoManage, snNoData);
    const expiryControl = this.getExpiryDateControl(billingStatus, rowData, isExpiryDateManage, batchNoData, isBatchBack);
    const produceDate = this.getproduceDateControl(billingStatus, rowData, isExpiryDateManage, batchNoData, isBatchBack);
    if (!tempfQuotePrice || tempfQuotePrice === 0) {
      tempfQuotePrice = rowData.fQuotePrice;
    }
    let bBack = false;
    if (billingStatus == 'FormerBackBill' || billingStatus == 'NoFormerBackBill') {
      if (rowData.fQuantity < 0) bBack = true;
    }
    return (
      <List>
        <List.Item extra={salesChecked} className={(billingStatus === 'FormerBackBill') ? 'change-sales' : ''} arrow={(!this.isReservestatus() || (billingStatus === 'FormerBackBill')) ? 'empty' : 'horizontal'} onClick={!this.isReservestatus() ? '' : this.onOperatorClick}>
          {(billingStatus === 'FormerBackBill') ? '营业员' : '主营业员'}
        </List.Item>
        {
          bBack
            ? ''
            : <List.Item className='editRow-price' extra={parseFloat(value).toFixed(monovalentdecimal)} disabled={true}
              onClick={() => {
                this.props.showModal('ModifyPrice');
              }}
            >
              零售价
            </List.Item>
        }
        {
          bBack
            ? ''
            : <List.Item className='editRow-discount' extra={parseFloat(parseFloat(dhData.discount).toFixed(2)).toFixed(monovalentdecimal)} disabled={true}
              onClick={() => {
                this.props.showModal('SceneDiscount');
              }}
            >
              折扣率
            </List.Item>
        }
        {
          bBack
            ? ''
            : <InputItem type='number' disabled={true} value={parseFloat(rowData.fPrice).toFixed(monovalentdecimal)} placeholder='请输入'>单价</InputItem>
        }
        {batchControl}
        {expiryControl}
        {produceDate}
        {snControl}
        <List.Item extra={(rowData.iWarehouseid_name && rowData.iWarehouseid_name != '') ? rowData.iWarehouseid_name : '请选择'} arrow='horizontal'
          onClick={this.onWareHouseClick}>
          仓库
        </List.Item>
        <InputItem type='digit' disabled value={Available} placeholder={Available}>可用量</InputItem>
        {defineControl}
        <TextareaItem id='change-remarks' autoHeight disabled={!this.isReservestatus()} className='editRow-memo' value={rowData.cMemo}
          placeholder={this.isReservestatus() ? '请输入' : ''} title='备注'
          onChange={val => this.onChange(val, 'cMemo')} />
      </List>
    )
  }

  tabClick = (activeKey) => {
    this.actions.setCommonData({ activeKey: activeKey })
  }

  getHeaderView () {
    const { rowData, activeKey } = this.props.editRow;
    const { billingStatus } = this.props.uretailHeader;
    let titleView = '改行';
    if ((billingStatus === 'FormerBackBill' || billingStatus === 'NoFormerBackBill') && rowData.fQuantity < 0) {
      titleView = <div className='back-th-tab'>
        <span onClick={() => this.tabClick('backInfo')} className={(activeKey === 'backInfo' ? 'back-th-tab-active' : '')}>退货信息</span>
        <span onClick={() => this.tabClick('editRow')} className={(activeKey === 'editRow' ? 'back-th-tab-active' : '')}>改行</span>
      </div>;
    }
    return (
      <NavBar onLeftClick={this.onGoBack} title={titleView} />
    )
  }

  render () {
    const { activeKey } = this.props.editRow;
    const baseControl = this.getBaseControl();
    const height = document.documentElement.clientHeight;
    const params = this.props.match.params;
    return (
      <div className='billing-editRow fixed-top' style={{ height: height }}>
        {this.getHeaderView()}
        {activeKey === 'backInfo' ? (<BackReason params={params} />) : baseControl}
        <div className='button-fixed-bottom'>
          <Button type='primary' onClick={this.onOk}>保存</Button>
        </div>
        {/* <Operator /> */}
      </div>
    )
  }
}
function mapStateToProps (state) {
  return {
    editRow: state.editRow.toJS(),
    discount: state.discount.toJS(),
    uretailHeader: state.uretailHeader.toJS(),
    billing: state.billing.toJS(),
    salesClerk: state.salesClerk.toJS(),
    quote: state.quote.toJS(),
    actionState: state.actions.toJS(),
    state
  }
}

function mapDispatchToProps (dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
    discountActions: bindActionCreators(discountActions, dispatch),
    quoteActions: bindActionCreators(quoteActions, dispatch),
    salesOk: bindActionCreators(salesOk, dispatch),
    handleCancel: bindActionCreators(handleCancel, dispatch),
    showModal: bindActionCreators(showModal, dispatch),
    checkShowModal: bindActionCreators(checkShowModal, dispatch),
    handleOk: bindActionCreators(handleOk, dispatch),
    dispatch,
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditRow);
