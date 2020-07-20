import React from 'react';
import styles from './index.css';

// import logo from 'src/mobile/styles/default/images/logo-gray.png'

export class HeadTitle extends React.PureComponent {
  render () {
    return (<div className={styles.top}>
      <div className={styles.header}>
        {/*  <img alt="logo" className={styles.logo} src={require('src/mobile/styles/default/images/logo-gray.png')}/> */}
        <div className='sign-title'>欢迎登录</div>
      </div>

    </div>);
  }
}
