import * as React from 'react';
import _ from 'lodash'
import {connect} from 'react-redux';
// import {RouteComponentProps} from 'react-router';
// import {RootState} from '../../reducers';
import {bindActionCreators } from 'redux';
import {push} from 'react-router-redux'

class AppContainer extends React.Component {
  renderNav () {
    const links = ['login', 'forget', 'menu', '/', 'billingTouch']
    return (<ul>
      {_.map(links, link => {
        return <li key={link} onClick={() => this.props.historyPush(link)}>{link}</li>
      })}
    </ul>)
  }

  render () {
    return (
      <div>
        {this.renderNav()}

      </div>
    );
  }
}

function mapStateToProps (state) {
  return {

  };
}

function mapDispatchToProps (dispatch) {
  return {
    dispatch,
    historyPush: bindActionCreators(push, dispatch)
  };
}

export const App = connect(mapStateToProps, mapDispatchToProps)(AppContainer)
