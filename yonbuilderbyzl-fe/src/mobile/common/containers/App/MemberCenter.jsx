import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
// import * as mineActions from "src/common/actions/mine"
// import { logOut } from "src/common/actions/user"
// import { Toast, List, Button, Icon } from '@mdf/baseui-mobile';
// import { push } from 'react-router-redux'
// import Immutable from 'immutable'
// import styles from './style.css'
import { toggle_tabbar } from 'src/common/reducers/modules/tabBar'

class MemberCenter extends Component {
  constructor (props) {
    super(props);
  }

  render () {
    return (
      <div>会员中心 ~ 啦啦啦~
      </div>)
  }
}

function mapPropsToState (state) {
  return {

  }
}

function mapPropsToDispatch (dispatch) {
  return {
    toggle_tabbar: bindActionCreators(toggle_tabbar, dispatch),
    dispatch
  }
}

export default connect(mapPropsToState, mapPropsToDispatch)(MemberCenter);
