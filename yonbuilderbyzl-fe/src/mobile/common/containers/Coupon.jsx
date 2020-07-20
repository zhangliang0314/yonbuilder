import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { List, Button, SearchBar } from 'antd-mobile';
// import * as couponActions from '../reducers/modules/coupon';
import {
  handleOk, Youhuiquan_ChooseCoupon, Youhuiquan_ChangeCouponKey, Youhuiquan_changeCouponTimes,
  Youhuiquan_InputCoupon, handleCancel
} from 'src/common/redux/modules/billing/actions';
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar';
import { dateFormat } from '@mdf/cube/lib/helpers/formatDate';
require('@mdf/theme-mobile/theme/coupon.css');

class Coupon extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor (props) {
    super(props);
    this.actions = props.couponActions;
    this.isLoading = true;
    this.isIos = cb.utils.isIos();
  }

  onGoBack = () => {
    this.props.handleCancel()
  }

  onOk = () => {
    this.props.handleOk('Coupon');
  }

  onRowClick = (e, row) => {
    // const key = row.id + '_' + row.coupon_id;
    this.props.Youhuiquan_ChooseCoupon(row.sn, !row.displaySelected);
  }

  getNoUseControl = (noUseData) => {
    const controls = [];
    let date = ''; let exp_date = ''; let effect_date = '';
    noUseData.map(row => {
      // const key = row.id + '_' + row.coupon_id;
      let unit = ''; let discount = ''; let type_name = row.type_name;
      // if (checkedRow[key]) extra = ' active';
      if (this.isIos) {
        row.exp_date = row.exp_date.replace(/-/g, '/');
        row.effect_date = row.effect_date.replace(/-/g, '/');
      }
      exp_date = dateFormat(new Date(row.exp_date.replace(/-+/g, '/')), 'yyyy-MM-dd');
      effect_date = dateFormat(new Date(row.effect_date.replace(/-+/g, '/')), 'yyyy-MM-dd');
      date = effect_date + '-' + exp_date;
      switch (row.type) {
        case 1:
          unit = '元';
          discount = row.reduce_amount;
          break;
        case 2:
          unit = '折';
          discount = row.discount;
          break;
        case 5:
          unit = '次';
          discount = row.remain_times;
          break;
        case 6:
          type_name = '兑换券';
          unit = '次';
          discount = 1;
          break;
        default:
          break;
      }
      controls.push(
        <List.Item key={row.id} className='coupon-type-disabled'>
          <div className='coupon-left'>
            <h4>{type_name}</h4>
            <h5 className='coupon-title'>{row.title}</h5>
            <p className='coupon-date'>{date}</p>
          </div>
          <div className='coupon-discount'>
            <span className='discount'>{discount}</span>
            <span className='unit'>{unit}</span>
          </div>
        </List.Item>
      );
    });
    if (controls.length == 0) return null;
    return (
      <List className='billing-coupon-noUseList'
        renderHeader={() => <div className='coupon-segmenting'><span>不可用的券</span></div>}
      >{controls}</List>
    )
  }

  getControl = (couponData) => {
    let controls = [];
    let extra = ''; let date = ''; let exp_date = ''; let effect_date = '';
    couponData.map(row => {
      // const key = row.id + '_' + row.coupon_id;
      let unit = ''; let discount = ''; let type_name = row.type_name;
      // if (checkedRow[key]) extra = ' active';
      if (row.displaySelected) extra = ' active';
      if (this.isIos) {
        row.exp_date = row.exp_date.replace(/-/g, '/');
        row.effect_date = row.effect_date.replace(/-/g, '/');
      }
      exp_date = dateFormat(new Date(row.exp_date), 'yyyy-MM-dd');
      effect_date = dateFormat(new Date(row.effect_date), 'yyyy-MM-dd');
      date = effect_date + '-' + exp_date;
      switch (row.type) {
        case 1:
          unit = '元';
          discount = row.reduce_amount;
          break;
        case 2:
          unit = '折';
          discount = row.discount;
          break;
        case 5:
          unit = '次';
          discount = row.remain_times;
          break;
        case 6:
          type_name = '兑换券';
          unit = '次';
          discount = 1;
          break;
        default:
          break;
      }
      controls.push(
        <List.Item key={row.id} onClick={e => this.onRowClick(e, row)} className={'coupon-type-' + row.type}>
          <span className={'coupon-extra' + extra} />
          <div className='coupon-left'>
            <h4>{type_name}</h4>
            <h5 className='coupon-title'>{row.title}</h5>
            <p className='coupon-date'>{date}</p>
          </div>
          <div className='coupon-discount'>
            <span className='discount'>{discount}</span>
            <span className='unit'>{unit}</span>
          </div>
        </List.Item>
      );
      extra = '';
    });
    if (controls.length == 0 && !this.isLoading) {
      controls = <ul className='developing'><li className='no-coupon' /><li>暂无优惠券，请手动添加～</li></ul>
    } else {
      this.isLoading = false;
    }
    return (
      <List>{controls}</List>
    )
  }

  onScan = () => {
    this.context.router.history.push('/scanBarcode/coupon');
  }

  onSearchChange = (couponKey) => {
    this.props.Youhuiquan_ChangeCouponKey(couponKey);
  }

  onCouponSearch = (val) => {
    const { actionsState } = this.props;
    const data = actionsState.modalData.Coupon;
    const couponKey = data.couponKey.trim();
    let bExist = false;
    if (couponKey == '') {
      cb.utils.alert('请录入优惠券。');
    } else {
      if (data.editData.CouponList) {
        data.editData.CouponList.forEach(ele => {
          if (couponKey == ele.sn) {
            bExist = true;
            if (ele.displayType == 5) {
              if (ele.displaySelected == true) {
                this.props.Youhuiquan_changeCouponTimes(ele.displayType, ele.displayId, (ele.displaySelectTimes ? ele.displaySelectTimes : 0) + 1);
              }
              else {
                this.ChooseCoupon(ele.displayType, ele.displayId, true);
              }
            }
            else {
              if (ele.displaySelected == true) {
                cb.utils.alert('优惠券已经存在，请检查。');
              }
              else {
                this.ChooseCoupon(ele.displayType, ele.displayId, true);
              }
            }
          }
        }
        );
      }
      if (bExist == false)
        this.props.Youhuiquan_InputCoupon(couponKey);
    }
  }

  ChooseCoupon (displayType, displayId, bChoose) {
    this.props.Youhuiquan_ChooseCoupon(displayId, bChoose);
    // if (displayType == "5" && bChoose == true) {
    //   this.state.curSelectedCouponId = displayId;
    // }
  }

  onCouponClear = () => {
    this.props.Youhuiquan_ChangeCouponKey('');
  }

  render () {
    const CouponList = this.props.actionsState.modalData.Coupon.editData.CouponList;
    const useList = []; const noUseList = [];
    CouponList && CouponList.map(item => {
      if (item.buse) {
        useList.push(item);
      } else {
        noUseList.push(item);
      }
    });
    const control = this.getControl(useList);
    const noUseControl = this.getNoUseControl(noUseList);
    let bHasOk = true;
    if (useList.length == 0 && noUseList.length == 0) bHasOk = false;
    return (
      <div className='billing-coupon fixed-top'>
        <NavBar title='选择优惠券' goBack={this.onGoBack} />
        <div className='billing-coupon-search billing-member-search' style={{ marginTop: '1.48rem' }}>
          <SearchBar showCancelButton={false} onChange={this.onSearchChange} onSubmit={this.onCouponSearch} onClear={this.onCouponClear} placeholder='请输入或扫描优惠券' />
          <i className='icon icon-saoyisao' onClick={this.onScan} />
        </div>
        {control}
        {noUseControl}
        {
          bHasOk
            ? <div className='button-fixed-bottom button-fixed-shadow'>
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
    coupon: state.coupon.toJS(),
    actionsState: state.actions.toJS()
  }
}

function mapDispatchToProps (dispatch) {
  return {
    Youhuiquan_ChooseCoupon: bindActionCreators(Youhuiquan_ChooseCoupon, dispatch),
    handleOk: bindActionCreators(handleOk, dispatch),
    handleCancel: bindActionCreators(handleCancel, dispatch),
    Youhuiquan_ChangeCouponKey: bindActionCreators(Youhuiquan_ChangeCouponKey, dispatch),
    Youhuiquan_changeCouponTimes: bindActionCreators(Youhuiquan_changeCouponTimes, dispatch),
    Youhuiquan_InputCoupon: bindActionCreators(Youhuiquan_InputCoupon, dispatch),
    dispatch,
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Coupon);
