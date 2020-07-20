import React, { Component } from 'react';
// import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import { Modal } from '@mdf/baseui-mobile';
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar';
// import * as mineActions from "src/common/actions/mine";
import logo from '@mdf/theme-mobile/theme/images/logo.png';
import nophoto from '@mdf/theme-mobile/theme/images/logo-title.png'
import { withRouter } from 'react-router'
class VersionInfo extends Component {
  constructor (props) {
    super(props);
    // 设置状态栏字体黑色
    cb.utils.setStatusBarStyle('dark');
    this.state = { oldPwd: '', newPwd: '', confirmPwd: ''};
  }

  onLeftClick () {
    // 设置状态栏字体白色
    cb.utils.setStatusBarStyle('light');
    this.props.router.goBack();
  }

  onHandClick () {
    const key = 'local_log';
    let _storageLog = null;
    if(window.plus) {
      if(window.plus.navigator && !window.plus.navigator.isLogs()) {
        window.plus.navigator.setLogs(true); // 开启原生设置应用是否输出日志信息，默认关闭输出日志功能。 日志包括应用原生层内部跟踪日志（ADB、LogCat工具可获取的日志）及JS层跟踪日志（console.log输出的日志）。 开启日志在一定程度上会降低程序的性能
      }
      if(window.plus.storage)
        _storageLog = plus.storage.getItem(key);
    }
    Modal.alert('', _storageLog || '暂无日志', [
      { text: '关闭', onPress: () => {} },
      { text: '清空', onPress: () => {
        if(window.plus && window.plus.navigator) {
          window.plus.navigator.setLogs(false);
          plus.storage.removeItem(key);
        }
      }}, ]);
  }

  render () {
    const height = document.documentElement.clientHeight;

    return (
      <div style={{height: height + 'px'}} className='modify-edition'>
        <NavBar onLeftClick={this.onLeftClick.bind(this)} title='版本' />
        <div>
          <ul className='my-logo'>
            <li><img src={logo} className='my-logo-img' /></li>
            <li><img src={nophoto} className='edition-yls' /></li>
          </ul>
          <div className='my-edition-img' onClick={this.onHandClick.bind(this)} />
          <div className='my-edition-copy-title'>V1.0.0</div>
          <div className='my-edition-copyright'>您的软件是最新版本</div>
        </div>
      </div>
    )
  }
}

export default connect()(withRouter(VersionInfo));
