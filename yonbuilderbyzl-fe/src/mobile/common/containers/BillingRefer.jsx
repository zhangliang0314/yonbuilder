import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { List, Icon } from 'antd-mobile';
import * as actions from '../reducers/modules/billingRefer';
import * as reserveActions from 'src/common/redux/modules/billing/reserve';
import * as userActions from 'src/common/redux/modules/user'
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar';
import { genAction } from '@mdf/cube/lib/helpers/util';

class BillingRefer extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  constructor (props) {
    super(props);
    this.actions = props.actions;
    // 设置状态栏字体黑色
    cb.utils.setStatusBarStyle('dark');
  }

  onClick = (e, row, reduxName) => {
    if (this.props.location.state === 'ChooseStores') {
      this.props.dispatch(genAction('PLATFORM_UI_BILLING_DATASOURCE_REMOVE_CODE'), '');
      this.props.dispatch(genAction('PLATFORM_UI_BILLING_CLEAR'));
      this.props.userActions.changeStore(row.store, row.store_name);
    } else if (this.props.location.state === 'editReserve') {
      const val = {};
      val.wareHouse = row;
      this.props.reserveActions.setCommonData(val);
    } else {
      this.actions.referReturn(row, reduxName);
    }
    this.context.router.history.goBack();
  }

  getControl = (dataSource) => {
    const { showType, showItem, reduxName, checkedRow } = this.props.billingRefer.toJS();
    const controls = [];
    const imgItemName = showItem.imgItemName; const cItemName = showItem.cItemName;
    let title = ''; let className = ''; let color = null;

    dataSource.map((row, index) => {
      let extra = ''; let url = null; let classNameSpan = 'Initials';
      if (cItemName) title = row[cItemName];
      if (checkedRow.compareItem && checkedRow.row) {
        for (var i = 0; i < checkedRow.row.length; i++) {
          if (row[checkedRow.compareItem] == checkedRow.row[i]) {
            extra = <Icon type='icon-xuanzhong1' />;
            break
          }
        }
      }
      if (showType == 'operator') {
        if (imgItemName) url = row[imgItemName] ? row[imgItemName] : url;
        className = 'refer-operator';
        if (!url) {
          // if (row.gender == 2) {
          //     url = <span className="no-avatar-woman"></span>
          // } else {
          //     url = <span className="no-avatar-man"></span>
          // }
          let first = '';
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
          classNameSpan = classNameSpan + '  ' + color;
          if (typeof title == 'number') title = title.toString();
          first = title[0].toLocaleUpperCase();
          url = <span className={classNameSpan}>{first}</span>
        }
        controls.push(
          <List.Item key={index} thumb={url} extra={extra}
            onClick={e => this.onClick(e, row, reduxName)}
          >{title}</List.Item>
        )
      } else {
        className = 'refer-other';
        controls.push(
          <List.Item key={index} extra={extra}
            onClick={e => this.onClick(e, row, reduxName)}
          >{title}</List.Item>
        )
      }
    });

    return <List className={className}>{controls}</List>
  }

  render () {
    const { title, dataSource } = this.props.billingRefer.toJS();
    const control = this.getControl(dataSource);
    return (
      <div className='billing-refer fixed-top'>
        <NavBar title={title} />
        {control}
      </div>
    )
  }
}
function mapStateToProps (state) {
  return {
    billingRefer: state.billingRefer,
    uretailHeader: state.uretailHeader.toJS(),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
    reserveActions: bindActionCreators(reserveActions, dispatch),
    userActions: bindActionCreators(userActions, dispatch),
    dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(BillingRefer);
