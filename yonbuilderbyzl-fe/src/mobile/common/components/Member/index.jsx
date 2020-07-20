import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Icon, SearchBar } from '@mdf/baseui-mobile';
import * as memberActions from 'src/common/redux/modules/billing/member';
import sendScanAction from '../../reducers/modules/scanBarcode';
import { withRouter } from 'react-router'

class Member extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor (props) {
    super(props);
    this.actions = props.memberActions;
    this.barcode = null;
  }

  componentDidMount () {

  }

  onSearchChange = (val) => {
    this.actions.MemberBoxClear(val);
  }

  onSubmit = (val) => {
    this.actions.queryMember(val);
    cb.rest.bMemberFocused = false;
  }

  onScan = () => {
    if (cb.rest.isWeChat) {
      wx.scanQRCode({
        needResult: 1, // 默认为0，扫描结果由微信处理，1则直接返回扫描结果，
        scanType: ['qrCode', 'barCode'], // 可以指定扫二维码还是一维码，默认二者都有
        success: (res) => {
          let resultStr = res.resultStr.split(',');
          if(resultStr.length > 1)
            resultStr = resultStr[1]
          else
            resultStr = resultStr[0];
          this.props.sendScanAction({ reduxName: 'member', data: resultStr });
        }
      });
    } else
      this.props.history.push('/scanBarcode/member');
  }

  getMemberInfoControl = (memberInfo, couponInfo) => {
    const src = memberInfo.portrait || memberInfo.fans_portrait;
    let showName = memberInfo.realname;
    if (!showName || showName == '') {
      showName = memberInfo.phone;
    }
    return (
      <div className='billing-member-info'>
        <div className='member-avatar'>
          <div className='imperial-crown' />
          {
            src
              ? <img src={src} />
              : <div className='default-avatar' />
          }
        </div>
        <div className='member-info-count'>
          <div className='info'>
            <span className='username'>{showName}</span>
            <span className='level'>{memberInfo.level_name}</span>
          </div>
          <div className='other'>
            <div className='points'>
              <span className='points-name'>积分</span>
              <span className='points-number'>{memberInfo.points || '0'}</span>
            </div>
            <div className='coupon '>
              <span className='coupon-name'>优惠券</span>
              <span className='coupon-number'>{couponInfo && couponInfo.length > 0 ? couponInfo.length : 0}</span>
            </div>
            <div className='balance'>
              <span className='balance-name'>余额</span>
              <span className='balance-number'>{memberInfo.storage_balance || '0.00'}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  onFocus = () => {
    cb.rest.bMemberFocused = true;
  }

  onBlur = () => {
    cb.rest.bMemberFocused = false;
  }

  render () {
    const { inputValue, memberInfo, couponInfo, barcode } = this.props.member;
    const bHasMember = memberInfo.code == 200;
    // const billingStatus = this.props.uretailHeader.billingStatus;
    if (barcode != null) this.actions.queryMember(barcode);
    return (
      bHasMember
        ? this.getMemberInfoControl(memberInfo.data, couponInfo)
        : (<div className='billing-member-search'><SearchBar
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          value={inputValue}
          placeholder='手机号/会员号'
          onSubmit={this.onSubmit}
          showCancelButton={false}
          onChange={this.onSearchChange}
        /><Icon type='icon-saoyisao' className='saoyisao' onClick={this.onScan} /></div>)
    )
  }
}
function mapStateToProps (state) {
  return {
    member: state.member.toJS(),
    uretailHeader: state.uretailHeader.toJS(),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    memberActions: bindActionCreators(memberActions, dispatch),
    sendScanAction: bindActionCreators(sendScanAction, dispatch),
    dispatch,
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Member));
