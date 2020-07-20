import * as React from 'react';
// import PropTypes from 'prop-types';
// import { Button, List, InputItem, Grid, Modal, Flex} from '@mdf/baseui-mobile';
import { bindActionCreators } from 'redux';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import Immutable from 'immutable'
import classnames from 'classnames'
import { metaInit } from '@mdf/metaui-mobile/lib/redux/portal';
import SvgIcon from '@mdf/metaui-mobile/lib/components/common/SvgIcon';
require('@mdf/theme-mobile/theme/backbilling.css')

export class Menu extends React.Component {
  constructor (props) {
    super(props);
    this.state = { modalVisible: false, isChoose: 0 };
  }

  shouldComponentUpdate (nextProps, nextState) {
    return !Immutable.is(this.props.menu, nextProps.menu) || nextState.modalVisible !== this.state.modalVisible || nextState.isChoose !== this.state.isChoose;
  }

  componentDidMount () {
    this.mounted = true
  }

  handleClick (menuItem) {
    const { children, code } = menuItem;
    if (children && children.length) {
      this.props.historyPush(`/menu/${code}`);
      return;
    }
    switch (menuItem.code) {
      case 'MRM0101':/* 零售开单 */
        menuItem.menuUrl && this.props.historyPush(menuItem.menuUrl);
        return;
      case 'MRM0102':/* 零售单 */
        break;
      case 'MRM0103':/* 退货 */
        this.setState({ modalVisible: true });
        return;
      case 'MRM0104':/* 预定 */
        this.props.historyPush('/reserve')
        return;
      // case 'MRM0105':/*线上订单*/
      case 'MRM0106':/* 会员管理 */
      case 'MRM0107':/* 会员邀请 */
      case 'MRM0108':/* 配送中心 */
      case 'MRM0109':/* 门店收银 */
        cb.utils.alert({ title: '正在开发中，敬请期待！', type: 'info' });
        return;
      default:
        break;
    }
    // menuItem.metaKey = 'rm_saleanalysis';
    const params = Object.assign({}, menuItem, {
      userClick: true,
      menuId: menuItem.code
    });
    const callback = (returnData) => {
      const { key } = returnData;
      this.props.metaInit(key, returnData);
      this.props.historyPush(`/meta/${key}`);
    };
    cb.loader.runCommandLine('menu', params, null, callback);
  }

  backToExperience = () => {
    location.href = `${location.origin}/login`
    // this.props.historyPush('/login')
  }

  render () {
    // const { modalVisible } = this.state;
    // let menu = this.props.menu.toJS();
    // menu.push({"level":2,"tenant":617846899790080,"isShopRelated":true,"name":"店存入库","code":"ST0102","isDeleted":0,"isEnd":true,"authCode":"st_storeinlistlist","terminalType":"1","parentCode":"ST01","orderNum":20,"isSystem":true,"_walkStatus":"Allow","metaKey":"st_storeinlist","subId":"ST","pubts":"2018-03-13 11:06:24","disabled":false,"authLevel":3,"metaType":"voucherlist","viewType":"meta","userClick":true,"menuId":"ST0102","query":{},"billNo":"st_storeinlist","type":"bill"});
    // const { modalVisible, isChoose } = this.state;
    const menu = this.props.menu.TreeData.filter(item => {
      return item.code !== 'MR';
    });
    return <div>
      {/*
    return <div>menu
      <Grid
        onClick={el => {
          el.menuUrl && this.props.historyPush(el.menuUrl)
        }}
        renderItem={el => (
          <div>
            <div style={{color: '#888', fontSize: '14px', marginTop: '12px'}}>
              <span>{el.text}</span>
            </div>
          </div>

        )}
        data={_.map(menu, item => {
          return {
            text: item.name,
            ...item,
            icon: ''
          }
        })}/>
*/}

      <div className='UretailMobile-Menu-Wrap clearfix'>
        {menu.map(item => {
          return <div className='UretailMobile-Menu' key={item.code} onClick={() => { this.handleClick(item); }
          }>
            <div className={
              classnames('UretailMobile-Menu-Icon', `MenuIcon${item.icon}`)
            } />
            <span>{item.name}</span>
          </div>
        })}
      </div>
      {this.mounted && cb.rest.AppContext.user && cb.rest.AppContext.user.isDemoAccount ? <div className='experience_btn' onClick={this.backToExperience}><SvgIcon type='fanhuihangye' /></div> : null}
    </div>
  }
}

function mapStateToProps (state) {
  return {
    menu: state.tree.toJS()
  }
}

function mapDispatchToProps (dispatch) {
  return {
    dispatch,
    historyPush: bindActionCreators(push, dispatch),
    metaInit: bindActionCreators(metaInit, dispatch),
  }
}

export const MenuContainer = connect(mapStateToProps, mapDispatchToProps)(Menu)
