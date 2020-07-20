import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { List, InputItem, Button, Icon, Modal, SegmentedControl, NavBar } from 'antd-mobile';
import * as operatorActions from 'src/common/redux/modules/billing/operator';
import { initDiscount } from 'src/common/redux/modules/billing/discount';

class Operator extends Component {
  constructor (props) {
    super(props);
    this.actions = props.operatorActions;
  }

  componentDidMount () {
    // this.actions.getCouponData();
  }

  /* 切换 密码/验证码 */
  onTabClick = (e) => {
    const activeKey = e.nativeEvent.selectedSegmentIndex;
    this.actions.changeTab(activeKey);
  }

  handleOk = () => {
    const { operator } = this.props;
    const { user, bMsgCheck, password, checkCode, activeKey } = operator;
    if (!user.mobile) {
      this.actions.setCommonData({ errInfo: '请选择操作员！' });
      return
    }
    if (bMsgCheck && activeKey == '1') {
      if (!checkCode || checkCode == '') {
        this.actions.setCommonData({ errInfo: '请输入验证码！' });
        return
      }
    } else {
      if (!password || password == '') {
        this.actions.setCommonData({ errInfo: '请输入密码！' });
        return
      }
    }
    this.actions.setRepairModal(false, true);
  }

  onClose = () => {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this.actions.setCommonData({ waiting: false, second: 60 });
    this.actions.setRepairModal(false);
    this.props.initDiscount();
  }

  /* 取消选中操作员 */
  onGoBack = () => {
    this.actions.setCommonData({ bUser: false });
  }

  /* 更改密码 */
  onPasswordChange = (value) => {
    this.actions.setPassword(value);
  }

  /* 验证码 */
  onCheckCodeChange = (value) => {
    this.actions.setCommonData({ checkCode: value });
  }

  /* 发送验证码 */
  sendSms = () => {
    const { operator } = this.props;
    let { waiting, second, user } = operator;
    if (waiting == true) return;
    if (!user.mobile || user.mobile == '') {
      this.actions.setCommonData({ errInfo: '请选择营业员！' });
      return;
    }
    const callback = () => {
      this._timer = setInterval(function () {
        second -= 1;
        if (second < 1) {
          this.actions.setCommonData({ waiting: false });
          second = 60;
          clearInterval(this._timer);
          this._timer = null;
        }
        this.actions.setCommonData({ second: second });
      }.bind(this), 1000);
    }
    this.actions.sendSms(user.mobile, callback);
  }

  /* 点击账号 */
  onOperatorClick = () => {
    this.actions.setCommonData({ bUser: true });
  }

  /* 选择操作员 */
  onSelectUser = (e, user) => {
    this.actions.setOperator(user.code, user);
  }

  getErrControl = (operator) => {
    const { errInfo, user, waiting, bMsgCheck, activeKey } = operator;
    if (bMsgCheck && activeKey == '1') {
      if (waiting && !errInfo) {
        return <span className='info'>已发送至{user.mobile}</span>
      } else {
        return <span className='err-info'>{errInfo}</span>;
      }
    } else {
      return <span className='err-info'>{errInfo}</span>;
    }
  }

  getBodyControl = () => {
    const { password, userCode, checkCode, bUser, activeKey,
      Operator_DataSource, waiting, second } = this.props.operator;
    const errControl = this.getErrControl(this.props.operator);
    let control; let listControl; const userControl = []; let className = 'Initials';
    if (bUser) {
      const dataSource = Operator_DataSource || [];
      let color = null;
      dataSource.forEach(function (ele, index) {
        let thumb = ele.name[0] ? ele.name[0].toLocaleUpperCase() : '';
        if (!color || color == 'purple')
          color = 'blue';
        else if (color == 'blue')
          color = 'red';
        else if (color == 'red')
          color = 'green';
        else if (color == 'green')
          color = 'yellow';
        else if (color == 'yellow')
          color = 'purple';
        className = className + '  ' + color;
        thumb = <span className={className}>{thumb}</span>
        if (ele.code == userCode) {
          userControl.push(
            <List.Item key={index} thumb={thumb} extra={<Icon type='icon-xuanzhong1' />}
              onClick={e => this.onSelectUser(e, ele)}
            >
              <div className='user-name'>{ele.name}</div>
              <div className='user-code'>{ele.code}</div>
            </List.Item>
          )
        } else {
          userControl.push(
            <List.Item key={index} thumb={thumb}
              onClick={e => this.onSelectUser(e, ele)}
            >
              <div className='user-name'>{ele.name}</div>
              <div className='user-code'>{ele.code}</div>
            </List.Item>
          )
          // userControl.push(
          //   <List.Item key={index} thumb={thumb}
          //     onClick={e => this.onSelectUser(e, ele)}
          //   >{ele.name + '/' + ele.code}</List.Item>
          // )
        }
      }, this);
      control = (
        <div className='billing-selectUser '>
          <NavBar icon={<i className='icon icon-fanhui' />} onLeftClick={this.onGoBack}>选择账号</NavBar>
          <List className='billing-operator-user'>{userControl}</List>
          {/* {errControl} */}
        </div>
      )
    } else {
      if (activeKey == 0) {
        listControl = (
          <List>
            <List.Item extra={userCode || '账号'} arrow='horizontal'
              onClick={this.onOperatorClick}>
              <i className='icon icon-zhanghao' />
            </List.Item>
            <InputItem placeholder='密码' type='password' value={password}
              onChange={this.onPasswordChange}>
              <i className='icon icon-mima' />
            </InputItem>
          </List>
        )
      } else {
        let checkCodeExtra = <div className='sendsms' onClick={this.sendSms}>获取验证码</div>;
        if (waiting) checkCodeExtra = <div className='sendsms-disabled'>{second + 's'}</div>;
        listControl = (
          <List>
            <List.Item extra={userCode || '账号'} arrow='horizontal'
              onClick={this.onOperatorClick}>
              <i className='icon icon-zhanghao' />
            </List.Item>
            <InputItem placeholder='验证码' type='number' value={checkCode}
              onChange={this.onCheckCodeChange}
              extra={checkCodeExtra}
            >
              <i className='icon icon-yanzhengma' />
            </InputItem>
          </List>
        )
      }

      control = (
        <div className='billing-operator'>
          <SegmentedControl values={['密码登录', '验证码登录']} selectedIndex={parseInt(activeKey)}
            onChange={this.onTabClick} />
          <div className='billing-operator-body'>
            {listControl}
            {errControl}
          </div>
          <Button type='primary' onClick={this.handleOk}>确定</Button>
        </div>
      )
    }
    return control;
  }

  render () {
    const { visible, bUser } = this.props.operator;
    const bodyControl = this.getBodyControl();
    return (
      <Modal className='billing-operator-modal'
        visible={visible} closable={!bUser} maskClosable={false}
        transparent
        onClose={this.onClose}
        title=''
      // footer={footer}
      >
        {bodyControl}
      </Modal>
    )
  }
}
function mapStateToProps (state) {
  return {
    operator: state.operator.toJS(),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    operatorActions: bindActionCreators(operatorActions, dispatch),
    initDiscount: bindActionCreators(initDiscount, dispatch),
    dispatch,
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Operator);
