import React, { Component } from 'react'
import { List, InputItem, DatePicker } from 'antd-mobile';
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as actions from 'src/common/redux/modules/billing/actions'
import { executeAction } from 'src/common/redux/modules/billing/config'
import { dateFormat } from '@mdf/cube/lib/helpers/formatDate';
import CusRefer from 'src/common/components/refer/CusRefer';

let isBlur = true;
class BackReason extends Component {
  constructor (props) {
    super(props);
    this.state = { params: {}, backReason: [{ label: '', value: '' }], isChooseBussiness: false };
    this.options = cb.rest.AppContext.option;
  }

  componentDidMount () {
    // this.getBackReasonRender();
  }

  getBackReasonRender () {
    const { modalData } = this.props.actions;
    const { backReason } = modalData.UpdateBackInfo;
    backReason.push({ label: '', value: '' });
    backReason.map((item) => {
      item.label = item.reason;
      item.value = item.id;
    });
    this.setState({ backReason });
  }

  onBlur = (fieldValue, fieldName) => {
    // let { params } = this.state;
    let val = fieldValue;
    if (fieldName === 'saleDate') {
      val = dateFormat(val, 'yyyy-MM-dd HH:mm:ss');
    }
    isBlur = true;
    // params[fieldName]=val;
    // this.setState({params});
    this.props.dActions.UpdateBackInfo_ValueChange(fieldName, val);
  }

  onChange = (fieldValue, fieldName) => {
    const { params } = this.state;
    let val = fieldValue;
    if (fieldName == 'goldFeeDiscountRate' && fieldValue > 100) return;

    if (fieldName === 'saleDate') {
      val = dateFormat(val, 'yyyy-MM-dd HH:mm:ss');
      this.props.dActions.UpdateBackInfo_ValueChange(fieldName, val);
    }
    params[fieldName] = val;
    this.setState({ params });
    // this.props.dActions.UpdateBackInfo_ValueChange(fieldName,val);
  }

  onSelect = (type, values) => {
    const { params } = this.state;
    if (type === 'dismiss')
      return;
    params.iBackid = values[0];
    this.setState({ params });
    this.props.dActions.UpdateBackInfo_ValueChange('iBackid', values[0]);
  }

  render () {
    let { params, isChooseBussiness } = this.state;
    const { actions, uretailHeader } = this.props;
    const { billingStatus } = uretailHeader;
    const { modalData } = actions;
    const { backReason } = modalData.UpdateBackInfo;
    let isNoOriginBackStatus = true;
    if (billingStatus === 'FormerBackBill') {
      isNoOriginBackStatus = false;
    }
    backReason.push({ label: '', value: '' });
    backReason.map((item) => {
      item.label = item.reason;
      item.value = item.id;
    });
    // let { rowData, Available, Define_DataSource, Batch_DataSource, isBatchBack } = this.props.editRow;
    if (isBlur || !params.fQuotePrice) {
      params = modalData.UpdateBackInfo.params;
      if (params.fQuotePrice) {
        isBlur = false;
        this.setState({ params });
      }
    }
    let saleDate = '';
    if (params.saleDate) {
      saleDate = new Date(params.saleDate.replace(/-+/g, '/'));
    }
    let temBackReason;
    if(params.iBackid) {
      temBackReason = _.find(backReason, (item) => { return item.value === params.iBackid }).reason;
    }
    return (
      <div className='fixed_height_cls'>
        <List>
          <InputItem disabled={!isNoOriginBackStatus} type='digit' placeholder='请输入'
            value={parseFloat(params.fQuotePrice).toFixed(this.options.monovalentdecimal)}
            onBlur={value => this.onBlur(value, 'fQuotePrice')}
            onChange={value => this.onChange(value, 'fQuotePrice')}>
            零售价</InputItem>
          <InputItem disabled={!isNoOriginBackStatus} type='digit' placeholder='请输入'
            value={parseFloat(params.foldPrice).toFixed(this.options.monovalentdecimal)}
            onBlur={value => this.onBlur(value, 'foldPrice')}
            onChange={value => this.onChange(value, 'foldPrice')}>
            原销售价</InputItem>
          <InputItem type='digit' value={params.fPrice} placeholder='请输入'
            onBlur={value => this.onBlur(value, 'fPrice')}
            onChange={value => this.onChange(value, 'fPrice')}>
            实退价</InputItem>
          <InputItem type='digit' value={params.fQuantity} placeholder='请输入'
            onBlur={value => this.onBlur(value, 'fQuantity')}
            onChange={value => this.onChange(value, 'fQuantity')}>
            数量</InputItem>
          <InputItem type='digit' value={(params.fMoney)} placeholder='请输入'
            onBlur={value => this.onBlur(value, 'fMoney')}
            onChange={value => this.onChange(value, 'fMoney')}>
            实退金额</InputItem>
          <InputItem type='digit' value={(params.goldFeeDiscountRate || 100)} placeholder='请输入'
            onBlur={value => this.onBlur(value, 'goldFeeDiscountRate')}
            onChange={value => this.onChange(value, 'goldFeeDiscountRate')}>
            退货折扣率</InputItem>
          <InputItem type='digit' value={params.goldFeeDiscountMoney || ''} placeholder='请输入'
            onBlur={value => this.onBlur(value, 'goldFeeDiscountMoney')}
            onChange={value => this.onChange(value, 'goldFeeDiscountMoney')}>
            退货折扣额</InputItem>
          <DatePicker disabled={!isNoOriginBackStatus} value={saleDate} mode='date' onChange={date => this.onChange(date, 'saleDate')}>
            <List.Item>原销售日期</List.Item>
          </DatePicker>
          {/* <Picker data={backReason} value={[params.iBackid || ""]} cols={1} onOk={e => this.onSelect('ok', e)} onDismiss={e => this.onSelect('dismiss', e)}> */}
          <List.Item onClick={() => this.setState({isChooseBussiness: true})} extra={params.iBackid ? temBackReason : '请选择'} arrow='horizontal'>退货原因{params.isNeedRefuseReason ? (<i>*</i>) : ''}</List.Item>
          {/* </Picker> */}
          <CusRefer title='选择退货原因' id={params.iBackid} isShow={isChooseBussiness} data={backReason} close={() => { this.setState({isChooseBussiness: false}) }} ok={(item) => { this.onSelect('ok', [item.value]); this.setState({isChooseBussiness: false}) }} />
        </List>
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    actions: state.actions.toJS(),
    editRow: state.editRow.toJS(),
    billing: state.billing.toJS(),
    uretailHeader: state.uretailHeader.toJS(),
    state
  }
}

function mapDispatchToProps (dispatch) {
  return {
    executeAction: bindActionCreators(executeAction, dispatch),
    dActions: bindActionCreators(actions, dispatch),
    dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(BackReason);
