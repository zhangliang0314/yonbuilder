import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { List, Button } from 'antd-mobile';
import * as promotionActions from 'src/common/redux/modules/billing/ExecutPromotion';
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar';
require('@mdf/theme-mobile/theme/coupon.css');

class Promotion extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor (props) {
    super(props);
    this.actions = props.promotionActions;
    this.isLoading = true;
  }

  componentDidMount () {
    this.isLoading = true;
    this.actions.getPromotionData();
  }

  onOk = () => {
    this.actions.exec();
  }

  onGoBack = () => {
    this.actions.clearPromotion();
  }

  onRowClick = (e, key, row) => {
    const { checkedList, checkedPromotion } = this.props.promotion;
    checkedList[key] = !checkedList[key];
    if (checkedList[key]) {
      checkedPromotion.push(row);
    } else {
      let index = 0;
      checkedPromotion.map((checkRow, i) => {
        if (checkRow[key] == key) index = i;
      });
      checkedPromotion.splice(index, 1);
    }
    this.actions.setData({ checkedList, checkedPromotion });
  }

  getControl = (promotionData, checkedList) => {
    const controls = [];
    let extra = '';
    if ((!promotionData || promotionData.length == 0) && !this.isLoading)
      return <ul className='developing'><li className='no-promotion' /><li>这里空空荡荡的～</li></ul>
    else
      this.isLoading = false;
    promotionData.map((row) => {
      if (checkedList[row.key]) extra = ' active';
      controls.push(
        <List.Item key={row.key} onClick={e => this.onRowClick(e, row.key, row)}>
          <div className='promotion-row'>
            <div className='tag'><span><i>{row.typeName}</i></span></div>
            <span className='name'>{row.name}</span>
            <div className={'promotion-btn' + extra} />
          </div>
        </List.Item>
      );
      extra = '';
    });
    return (
      <List>{controls}</List>
    )
  }

  render () {
    const { promotionData, checkedList } = this.props.promotion;
    const control = this.getControl(promotionData, checkedList);
    let bHasOk = true;
    if (promotionData.length == 0) bHasOk = false;
    return (
      <div className='promotion-01'>
        <NavBar title='选择促销活动' goBack={this.onGoBack} />
        {control}
        {
          bHasOk
            ? <div className='button-fixed-bottom'>
              <Button type='primary' onClick={this.onOk}>确定</Button>
            </div>
            : ''
        }
      </div>
    )
  }
}
function mapStateToProps (state) {
  return {
    promotion: state.promotion.toJS(),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    promotionActions: bindActionCreators(promotionActions, dispatch),
    dispatch,
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Promotion);
