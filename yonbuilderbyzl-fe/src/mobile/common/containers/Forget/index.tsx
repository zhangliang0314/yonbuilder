import React, {Component, createElement} from 'node_modules0/react';
import ReactDOM from 'node_modules0/react-dom';
import PropTypes from 'node_modules0/prop-types';
import {bindActionCreators} from 'node_modules0/redux';
import {connect} from 'node_modules0/react-redux';
import {Button, List, InputItem, NavBar, Icon, Toast} from 'node_modules0/antd-mobile';
import * as forgotActions from '../../reducers/modules/forget';


/*
export class Forgot extends Component<{}, {}> {

    constructor(props) {
        super(props);
        this.actions = props.forgotActions;
    }
    componentDidMount() {

    }
    componentWillUnmount() {
        this.time = null;
    }
    /!*获取验证码*!/
    getValidateCode = () => {
        let phone = this.props.forgot.phone;
        const err = (json) => {
            Toast.info(json.message, 1);
        }
        const success = (json) => {
            Toast.info(json.message, 1);
            this.time();
        }
        this.actions.getValidateCode({ phone: phone.replace(/\s/g, ""), err: err, success: success });
    }
    /!*输入框改变*!/
    onInputChange = (val, type) => {
        let { phone, validateCode, newPassword, oldPassword, disabled_code, wait } = this.props.forgot;
        let data = {}, disabled = disabled_code;
        data[type] = val;
        if (type == "phone") {
            data.validPhone = this.isValidPhone(val);
            if (!data.validPhone) {
                data.disabled_code = false;
            } else {
                data.disabled_code = true;
            }
            disabled = data.disabled_code;
        }
        if (type == 'validateCode') validateCode = val;
        if (type == 'newPassword') newPassword = val;
        if (type == 'oldPassword') oldPassword = val;

        if ((disabled == false || wait != 60) && phone && validateCode && newPassword && oldPassword) {
            if (phone != '' && validateCode != '' && newPassword != '' && oldPassword != '' && newPassword == oldPassword) {
                data.disabled_button = false;
            } else {
                data.disabled_button = true;
            }
        } else {
            data.disabled_button = true;
        }
        this.actions.setData(data);
    }
    /!*更改密码*!/
    changePassword = (params) => {
        const err = (json) => {
            Toast.info(json.message, 1);
        }
        const success = (json) => {
            Toast.info(json.message, 1);

        }
        this.actions.changePassword({ params: params, err: err, success: success });
    }
    /!*完成*!/
    onClick = () => {
        let { phone, validateCode, newPassword } = this.props.forgot;
        const err = (json) => {
            Toast.info(json.message, 1);
        }
        const success = (json) => {
            Toast.info(json.message, 1);
            this.changePassword({ phone: phone, password: newPassword });
        }
        this.actions.checkValidateCode({ params: { phone: phone.replace(/\s/g, ""), smsCode: validateCode }, err: err, success: success });
    }
    /!*校验手机号*!/
    isValidPhone(str) {
        const pattern = /^1[3|4|5|7|8][0-9]{9}$/;
        return pattern.test(str.replace(/\s/g, "")) ? false : true;
    }
    time = () => {
        let { wait, text } = this.props.forgot;
        const self = this;
        if (wait == 0) {
            this.actions.setData({ wait: 60, text: '获取验证码', disabled_code: false });
        } else {
            wait--;
            this.actions.setData({ wait: wait, text: wait + ' s', disabled_code: true });
            setTimeout(function () {
                if (self.time) self.time()
            }, 1000)
        }
    }
    getExtra = () => {
        let { disabled_code, text } = this.props.forgot;
        let className = 'cs-forgot-validate';
        if (disabled_code) className = 'cs-forgot-validate-disabled';
        return (
            <Button className={className} onClick={this.getValidateCode} disabled={disabled_code}>{text}</Button>
        )
    }
    render() {
        let { disabled_button, validPhone, phone, validateCode, newPassword, oldPassword } = this.props.forgot;
        let extra = this.getExtra();
        return (
            <div className="cs-forgot">
                <NavBar
                    mode="light"
                    iconName={false}
                    leftContent={
                        <Icon type={require('src/common/styles/svgs/back.svg')} onClick={() => {
                            this.actions.setData({
                                wait: 60, text: '获取验证码', phone: '', validateCode: '', newPassword: '',
                                oldPassword: '', disabled_button: true, disabled_code: true, validPhone: false,
                            });
                            this.context.router.goBack();
                        }

                        } />
                    }
                >忘记密码</NavBar>
                <List>
                    <InputItem value={phone} type="phone" error={validPhone} onChange={val => this.onInputChange(val, 'phone')}
                        placeholder="请输入手机号">
                        手机号
                    </InputItem>
                    <InputItem value={validateCode} onChange={val => this.onInputChange(val, 'validateCode')}
                        placeholder="请输入验证码" extra={extra}>
                        验证码
                    </InputItem>
                    <InputItem value={newPassword} type="password" onChange={val => this.onInputChange(val, 'newPassword')}
                        placeholder="新密码(6-20位数字或字母不允许有空格)">
                        新密码
                    </InputItem>
                    <InputItem value={oldPassword} type="password" onChange={val => this.onInputChange(val, 'oldPassword')}
                        placeholder="请再次输入新密码">
                        确认密码
                    </InputItem>
                </List>
                <Button onClick={this.onClick} type='primary' disabled={disabled_button}>完成</Button>
            </div>
        );
    }
}
*/


class ForgetForm extends Component<{}, {}> {
  render() {
    return ( <div><InputItem
      placeholder="请输入用户名"
      clear
      onChange={(v) => {
        console.log('onChange', v);
      }}
      onBlur={(v) => {
        console.log('onBlur', v);
      }}
    >用户名</InputItem><InputItem
      placeholder="请输入新密码"
      clear
      onChange={(v) => {
        console.log('onChange', v);
      }}
      onBlur={(v) => {
        console.log('onBlur', v);
      }}
    >新密码</InputItem></div>)
  }
}

export class Forgot extends Component<{ forget: any }, {}> {

  render() {
    return (<div>
      <ForgetForm/>
    </div>)
  }
}

function mapStateToProps(state) {
  return {
    forgot: state.forget.toJS()
  }
}

function mapDispatchToProps(dispatch) {
  return {
    forgotActions: bindActionCreators(forgotActions, dispatch)
  }
}

export const ForgetContainer = connect(mapStateToProps, mapDispatchToProps)(Forgot as any);

