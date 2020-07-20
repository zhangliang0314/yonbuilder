import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Button, InputItem } from '@mdf/baseui-mobile';
import './style.css'
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar'
import * as mineActions from 'src/common/actions/mine'

class ChangePassword extends Component {
  constructor (props) {
    super(props);
    // 设置状态栏字体黑色
    cb.utils.setStatusBarStyle('dark');
    this.state = { oldPwd: '', newPwd: '', confirmPwd: '', disabled: true};
  }

  save () {
    const oldPwd = this.state.oldPwd;
    const newPwd = this.state.newPwd;
    const confirmPwd = this.state.confirmPwd;

    if (newPwd === '' || confirmPwd === '' || oldPwd === '') {
      cb.utils.Toast('输入框不能为空!', 'error');
      return;
    }
    if (newPwd === oldPwd) {
      cb.utils.Toast('新密码不能与旧密码相同!', 'error');
      return;
    }
    if (newPwd !== confirmPwd) {
      cb.utils.Toast('输入两次新密码不一致!', 'error');
      return;
    }

    var obj = { newPassword: newPwd, password: oldPwd }
    this.props.actions.changePwd(obj, function (type, message) {
      if (type === 0) {
        this.setState({ oldPwd: '', newPwd: '', confirmPwd: '' });
        cb.utils.Toast('修改密码成功！', 'success');
        this.onLeftClick();
        // Toast.success(data.message, 1);
      } else {
        cb.utils.Toast(message, 'fail');
        // Toast.fail(data.message, 1);
      }
    }.bind(this));
  }

  inputChange (key, value) {
    switch (key) {
      case 'old':
        this.setState({ oldPwd: value.replace(/^ +| +$/g, '') });
        break;
      case 'new':
        this.setState({ newPwd: value.replace(/^ +| +$/g, '') });
        break;
      case 'confirm':
        this.setState({ confirmPwd: value.replace(/^ +| +$/g, '') });
        break;
      default:
        break;
    }
  }

  judgeInput () {
    const oldPwd = this.state.oldPwd;
    const newPwd = this.state.newPwd;
    const confirmPwd = this.state.confirmPwd;

    if (newPwd === '' || confirmPwd === '' || oldPwd === '') {
      this.setState({ disabled: true });
      return;
    }
    this.setState({ disabled: false });
  }

  onLeftClick () {
    // 设置状态栏字体白色
    cb.utils.setStatusBarStyle('light');
    this.props.history.goBack();
  }

  render () {
    return (
      <NavBar className='modify-password'>
        <div onLeftClick={this.onLeftClick.bind(this)} title='修改密码' />
        <div className='password-list am-list-body'>
          <InputItem type='password' onKeyUp={this.judgeInput.bind(this)} onChange={this.inputChange.bind(this, 'old')} clear placeholder='请输入' value={this.state.oldPwd}>旧密码</InputItem>
          <InputItem type='password' onKeyUp={this.judgeInput.bind(this)} onChange={this.inputChange.bind(this, 'new')} clear placeholder='6-20位数字或字母 不允许有空格' value={this.state.newPwd}>新密码</InputItem>
          <InputItem type='password' onKeyUp={this.judgeInput.bind(this)} onChange={this.inputChange.bind(this, 'confirm')} clear placeholder='请输入' value={this.state.confirmPwd}>密码确认</InputItem>
        </div>
        <Button className='password-btn' disabled={this.state.disabled} onClick={() => { this.save() }} type='warning'>确定</Button>
      </NavBar>
    )
  }
}

function mapStateToProps (state) {
  return {
    mine: state.mine.toJS(),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    actions: bindActionCreators(mineActions, dispatch),
    dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ChangePassword);
