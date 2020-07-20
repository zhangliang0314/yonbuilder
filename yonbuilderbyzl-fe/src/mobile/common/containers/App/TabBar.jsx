import { TabBar } from '@mdf/baseui-mobile'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { toggle_tabbar } from '../../reducers/modules/tabBar'
import Immutable from 'immutable'
import _ from 'lodash'
import styles from './tabBar.css'
import Home from './Home'
import { bindActionCreators } from 'redux'
import Mine from './Mine'
import SubMenu from '../Menu/SubMenu';

class AppTabBar extends Component {
  constructor (props, context) {
    super(props, context)
  }

  shouldComponentUpdate (nextProps) {
    return !Immutable.is(this.props.tabBar, nextProps.tabBar)
  }

  renderTab = (tab) => {
    return <div className='home-top-count' style={{ backgroundColor: 'white', height: '100%' }}>
      {
        (title => {
          const tabView = <div className={styles.tabBarTitle}>{title}</div>;
          switch (title) {
            case '首页':
              return <Home />
            case '分析':
              return <SubMenu menuId='MR' />
            case '看板':
              return <div className='page-info' style={{textAlign: 'center', lineHeight: '30px', fontSize: '20px'}}>看板</div>
            case '我的':
              return <Mine />
            default:
              return <div>{tabView}
                <ul className='developing'>
                  <li className='developing-img' />
                  <li>正在开发中，敬请期待...</li>
                </ul>
              </div>
          }
        })(tab.title)
      }

    </div>
  }

  tabStatus=(activeTabID) => {
    let color = 'light';
    switch(activeTabID) {
      case 0:
        color = 'light'; break;
      case 1:
        color = 'dark'; break;
      case 2:
        color = 'dark'; break;
      case 3:
        color = 'dark'; break;
    }
    cb.utils.setStatusBarStyle(color);
  }

  render () {
    const tabBar = this.props.tabBar.toJS()

    const { tabs, activeTabID } = tabBar
    this.tabStatus(activeTabID);
    const { toggle_tabbar } = this.props
    return <div className={styles.tabBarWrap}>
      <TabBar tintColor='#FF5735'
        barTintColor='white'>
        {_.map(tabs, tab => {
          return <TabBar.Item
            selected={activeTabID == tab.id}
            onPress={() => {
              // cb.utils.cusAudio();
              toggle_tabbar(tab.id)
            }}
            key={tab.icon}
            title={tab.title}
            icon={<i className={`icon-${tab.icon}`} />}
            selectedIcon={<i className={`icon-${tab.icon} active`} />}
          >
            {this.renderTab(tab)}
          </TabBar.Item>
        })}
      </TabBar>
    </div>
  }
}

function mapStateToProps (state) {
  return {
    tabBar: state.tabBar,
    // loginUser: state.user.get('loginUser').toJS(),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    toggle_tabbar: bindActionCreators(toggle_tabbar, dispatch),
    // logOut: bindActionCreators(logOut, dispatch),
    // changeStore: bindActionCreators(changeStore, dispatch),
    // initMetaAction:bindActionCreators( initMeta,dispatch)
    // dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppTabBar)
