import * as React from 'react';
import {Button, InputItem, Modal} from '@mdf/baseui-mobile';
import {HeadTitle} from '../../components/HeadTitle';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
// import {RootState} from '../../reducers';
import * as UserActions from 'src/common/redux/modules/user';
import {Icon} from '@mdf/baseui-mobile';
import {push, goBack} from 'react-router-redux'
import * as Actions from '../../constants/user'

require('@mdf/theme-mobile/theme/login.css')

// let preTime=0,clickNum=0;
export class Login extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      isErr: false,
      errMsg: '',
      visible: false,
      experienceVisible: false,
    }
  }

  componentWillMount () {
    let locurl = cb.utils.nativeStorage('urlstorage', 'deurl', null);
    if(locurl === null) {
      locurl = localStorage.getItem('privateurl');
    }
    if(locurl) {
      this.switchUrl(locurl);
    }
  }

  componentDidMount () {
    // if (this.props.user.get('username') == '') {
    const rememberAccount = localStorage.getItem('rememberAccount');
    const loginUserName = rememberAccount && JSON.parse(rememberAccount).username;
    loginUserName && this.props.actions.usernameChange(loginUserName)

    // }
    this.props.actions.getExperience()
  }

  handleLogin=() => {
    const {username, password} = this.props.user;
    const formValue = {
      username,
      password,
      rememberUser: true
    };
    this.props.actions.login(formValue);
  }

  onLoginClick = () => {
    this.props.actions.userLogin(() => {
      this.props.historyPush('/');
    }, this.err)
  }

  err = (msg) => {
    this.setState({isErr: true, errMsg: msg});
  }

  handleRemember = (e) => {
    const checked = e.target.checked
    this.props.dispatch({
      type: Actions.USER_SET_REMEMBER,
      payload: checked
    })
  }

  onInputChange = (val, type) => {
    const {usernameChange, passwordChange} = this.props.actions
    if (type == 'username') {
      usernameChange(val)
    } else {
      passwordChange(val)
    }
  };

  handleForget = () => {
    this.props.historyPush('/forget')
  }

  onPrivetaClick () {
    /* let tempTime = new Date().getTime();
    if(preTime===0){
      preTime = tempTime;
    }
    if(tempTime-preTime>3000){
      preTime=0,clickNum=0;
    }
    if(clickNum>=3 && tempTime-preTime<3000){ */
    const _self = this;
    Modal.prompt('请输入移动地址', '', [
      { text: '关闭' },
      { text: '切换', onPress: value => {
        _self.switchUrl(value);
      } },
    ], 'default', null, ['http || https ://'])
    /* }
    clickNum++; */
  }

  switchUrl=(value) => {
    if((window).plus && (window).plus.os && (parseFloat((window).plus.os.version.replace(/\.+/g, '')) < 60 || parseFloat((window).plus.os.version) < 6)) {
      cb.utils.Toast('系统版本低，暂时不支持切换!', 'info');
      return;
    }
    if(value.indexOf(location.origin) >= 0 || location.origin.indexOf(value) >= 0 || value === null || value === 'null') {
      return;
    }
    if( cb.utils.nativeStorage('urlstorage', 'deurl', value) === null ) {
      localStorage.setItem('privateurl', value);
    }
    cb.utils.loading(true);
    setTimeout(function () {
      if(value.indexOf(location.origin) >= 0 || location.origin.indexOf(value) >= 0) {
        cb.utils.loading(false);
        return;
      }
      window.open(value, '_self');
    }, 5000);
    window.open(value, '_self');
  }

  goExperience = () => {
    this.setState({experienceVisible: true})
  }

  experienceLogin (info) {
    const { loginAccount } = info
    if (!loginAccount) {
      cb.utils.alert('体验账户信息错误！', 'error')
      return
    }
    this.props.actions.demoLogin(loginAccount)
  }

  getExperienceListContent = (experienceList) => {
    if (!experienceList || !experienceList.length) return null
    const listContent = experienceList.map(ele => {
      return <li onClick={() => this.experienceLogin(ele)}>
        <i className={ele.icon} />
        <p>{ele.industryName}</p>
      </li>
    })
    return listContent || null
  }

  getExperienceContent = () => {
    const { experienceVisible } = this.state;
    const { experienceList } = this.props.user;
    const experienceListContent = this.getExperienceListContent(experienceList)
    return (
      <Modal
        className='experience_modal'
        visible={experienceVisible}
        closable={true}
        onClose={() => { this.setState({experienceVisible: false}) }}
      >
        <p className='experience_title'>选择行业</p>
        <ul className='experience_per'>{experienceListContent}</ul>
      </Modal>
    )
  }

  render () {
    const {username, password, errorMsg} = this.props.user
    const {visible} = this.state
    let errContent;
    if (errorMsg) {
      errContent = <div className='cs-login-err'>{errorMsg}</div>;
    }
    const experienceDom = this.getExperienceContent()
    return (
      <div className='sign-bg'>
        <div><HeadTitle /></div>
        <div className='login-content'>
          <div className='cs-login'>

            <div>
              <InputItem
                clear
                value={username} onChange={val => this.onInputChange(val, 'username')}
                placeholder='请输入用户名'>
                <Icon type='icon-yonghuming' className='icon-yonghuming' />
              </InputItem>

              <InputItem
                clear
                value={password}
                type={visible ? 'text' : 'password'}
                onChange={val => this.onInputChange(val, 'password')}
                placeholder='请输入密码'
                extra={<span onClick={() => {
                  this.setState({
                    visible: !this.state.visible
                  })
                }}><Icon type={visible ? 'icon-kejian' : 'icon-yincang'} /></span>}
              >

                <Icon type='icon-yidongduan-mima' className='icon-yidongduan-mima' />

              </InputItem>
              {/*    <div className="sign-lable-name">
                <Checkbox onChange={(e) => this.handleRemember(e)} checked={remember}>记住用户名</Checkbox>
                <span><a onClick={this.handleForget}>修改密码</a></span>
              </div>
*/}
              {errContent}
              <Button className='sign-btn' type='primary' onClick={this.handleLogin}
                disabled={username === '' || password === ''}>登录124</Button>
              <div className='private_url_cls'>
                <div className='experience' onClick={() => this.goExperience()}><p className='experience-icon'><Icon type='icon-lijitiyan' className='icon-lijitiyan' /></p><p>立即体验</p></div>
                {cb.rest.isWeChat ? null : <p className='changeadd' onClick={() => { this.onPrivetaClick() }}>切换云地址</p>}
              </div>
              {experienceDom}

            </div>

          </div>

        </div>
        {this.props.router.pathname == '/expire' &&
          <Modal
            className='port-expire-touch-wrap'
            visible={true}
          >
            <div>
              {/* <ExpirePage className='port-expire-touch'/> */}
              <i onClick={() => {
                this.props.dispatch(goBack())
              }} className='icon icon-danchuangguanbi' />
            </div>

          </Modal>}

      </div>)
    ;
  }
}

function mapStateToProps (state) {
  return {
    user: state.user.toJS(),
    router: state.router
  };
}

function mapDispatchToProps (dispatch) {
  return {
    actions: bindActionCreators(UserActions, dispatch),
    dispatch,
    historyPush: bindActionCreators(push, dispatch)
  };
}

export const LoginContainer = connect(mapStateToProps, mapDispatchToProps)(Login)
