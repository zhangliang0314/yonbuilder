import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { push, goBack } from 'react-router-redux';
import { metaInit } from '@mdf/metaui-mobile/lib/redux/portal';
import SvgIcon from '@mdf/metaui-web/lib/components/common/SvgIcon';
import { Badge } from '@mdf/baseui-mobile';
import { getReadedMessageData, getUnreadMessageData } from 'src/common/reducers/modules/messageList'
import * as treeactions from '@mdf/metaui-mobile/lib/redux/tree'

const RandomIcons = {
  0: 'tubiao1',
  1: 'tubiao2',
  2: 'tubiao3',
  3: 'tubiao4',
  4: 'tubiao5',
  5: 'tubiao'
};

class SubMenu extends Component {
  componentDidMount () {
    this.props.treeactions.setHandler(this.menuClick);
  }

  menuClick=(menuCode, menuItem) => {
    const params = Object.assign({}, menuItem, {
      userClick: true,
      menuId: menuItem.code
    });
    const callback = (returnData) => {
      const { key } = returnData;
      this.props.metaInit(key, returnData);
      this.props.push(`/meta/${key}`);
    };
    cb.loader.runCommandLine('menu', params, null, callback);
  }

  goBack = () => {
    this.props.goBack();
  }

  renderSubMenu (children) {
    return children.map((item, index) => {
      const { code, name } = item;
      return <li className='report-data-list' key={code} onClick={() => this.menuClick(code, item)}><div className='report-data-images'><SvgIcon type={RandomIcons[index % 6]} /></div>{name}</li>
    });
  }

  showMessageList = () => {
    this.props.push('/messageCenter')
    this.props.getUnreadMessageData()
    this.props.getReadedMessageData()
  }

  render () {
    const { menu, menuId, match } = this.props;
    const { TreeData } = menu;
    if (!TreeData || !TreeData.length)
      return null;
    const subMenu = TreeData.find(item => {
      return item.code === (menuId || match && match.params.menuId);
    });
    if (!subMenu)
      return null;
    const { children } = subMenu;
    const menuItems = this.renderSubMenu(children || []);
    return (
      <div className='report-data'>
        {/* <NavBar icon={menuId && 'kong'} title={name} onLeftClick={this.goBack} /> */}
        <h1 className='report-data-title'>数据分析</h1><span className='message-portal' onClick={this.showMessageList}><Badge text={this.props.messageList.value} overflowCount={99}><i className='icon icon-xiaoxi' />
        </Badge></span>
        <div className='report-data-count'>
          <div className='report-data-count-maxheight'>
            {menuItems}
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps (state) {
  return {
    menu: state.menu ? state.menu.toJS() : '',
    messageList: state.messageList ? state.messageList.toJS() : '',

  }
}

function mapDispatchToProps (dispatch) {
  return {
    push: bindActionCreators(push, dispatch),
    goBack: bindActionCreators(goBack, dispatch),
    metaInit: bindActionCreators(metaInit, dispatch),
    getReadedMessageData: bindActionCreators(getReadedMessageData, dispatch),
    getUnreadMessageData: bindActionCreators(getUnreadMessageData, dispatch),
    treeactions: bindActionCreators(treeactions, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SubMenu);
