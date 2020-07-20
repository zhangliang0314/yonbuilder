import React, { Component } from 'react';
import { Modal, Icon} from 'antd';
process.env.__CLIENT__ && require('./audit.less');
export default class ProductState extends Component {
  constructor (props) {
    super(props);
  }

  handelClick (state, e) {
    e.stopPropagation();
    const cPlatFormRemark = this.props.rowData.cPlatFormRemark
    if(state == 'audit') {
      Modal.info({
        title: '审核不通过原因',
        width: 600,
        height: 320,
        iconType: '',
        content: (
          <div className='audit-model'>
            <div>
              {cPlatFormRemark}
            </div>
            <footer />
          </div>
        )
      });
    }else{
      Modal.info({
        title: '违规下架原因',
        width: 600,
        height: 320,
        iconType: '',
        content: (
          <div className='audit-model'>
            <div>
              {cPlatFormRemark}
            </div>
            <footer />
          </div>
        )
      });
    }
  }

  render () {
    const platFormStaus = this.props.rowData.platFormStaus // 审核状态 为1 的时候是 已审核
    const mallupcount = this.props.rowData['detail!mallupcount'] || 0
    const malldowncount = this.props.rowData['detail!malldowncount'] || 0
    const uorderupcount = this.props.rowData['detail!uorderupcount'] || 0
    const uorderdowncount = this.props.rowData['detail!uorderdowncount'] || 0
    const iStatus = this.props.rowData['detail!iStatus'] // 商城上架 0 是未上架
    const iUOrderStatus = this.props.rowData['detail!iUOrderStatus'] // U订货上架 0 是未上架
    let content;
    switch (platFormStaus.value) {
      case '1':
        content = (
          <ul title='状态' className='product-price product-state clearfix' style={{width: '200px'}}>
            <li>
              {
                iStatus && iStatus.value != 'false'
                  ? <p>
                    <span title='商城上架数'>商城上架数 : </span>
                    <em title={mallupcount}> {mallupcount}</em>
                  </p>
                  : <strong>商城未上架</strong>
              }
              {
                iStatus && iStatus.value != 'false' ? <p>
                  <span title='线上零售价'>商城下架数 : </span>
                  <em title={malldowncount}> {malldowncount}</em>
                </p> : null
              }
            </li>
            <li>

              {
                iUOrderStatus && iUOrderStatus.value != 'false'
                  ? <p>
                    <span title='建议零售价'>U订货上架数 : </span>
                    <em title={uorderupcount}> {uorderupcount}</em>
                  </p>
                  : <strong>U订货未上架</strong>
              }
              {
                iUOrderStatus && iUOrderStatus.value != 'false' ? <p>
                  <span title='进货价'>U订货下架数 : </span>
                  <em title={uorderdowncount}> {uorderdowncount}</em>
                </p> : null
              }
            </li>
          </ul>
        )
        break;
      case '2':
        content = (
          <ul title='状态' className='product-price product-state clearfix' style={{width: '200px'}}>
            <li onClick={this.handelClick.bind(this, 'audit')} className='lower-frame'><strong>审核不通过 <Icon type='info-circle' /></strong></li>
          </ul>
        )
        break;
      case '3':
        content = (
          <ul title='状态' className='product-price product-state clearfix' style={{width: '200px'}}>
            <li onClick={this.handelClick.bind(this, 'forceDown')} className='lower-frame'><strong>违规下架 <Icon type='info-circle' /></strong></li>
          </ul>
        )
        break;
      default:
        content = (
          <ul title='状态' className='product-price product-state clearfix' style={{width: '200px'}}>
            <li><strong>未审核</strong></li>
          </ul>
        )
    }
    return content
  }
}
