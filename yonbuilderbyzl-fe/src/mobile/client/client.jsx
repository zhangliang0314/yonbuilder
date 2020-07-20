import '@babel/polyfill'

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import cb from '@mdf/cube/lib/cube'
import './init'
import '@mdf/cube/lib/helpers/polyfill'
import { configureStore, createHistory } from '../common/store'
import { Router } from '../common/route'
// import * as Actions from 'src/common/constants/user'
import { push, replace, goBack } from 'react-router-redux'
import Loading from '@mdf/metaui-mobile/lib/components/Loading'
// import { proxy } from '@mdf/cube/lib/helpers/util'
import env from '@mdf/cube/lib/helpers/env'
import { afterLogin } from 'src/common/redux/modules/user'
import { initCache } from '@mdf/metaui-mobile/lib/helper/injectCache';
import '@mdf/theme-mobile/theme';
// import '../common/styles/globalCss'
const businessContext = require.context('business')
cb.registerBusinessContext(businessContext)

const { pathname } = window.location
export const store = configureStore()
const history = createHistory(store, pathname)
initCache(cb)
env.INTERACTIVE_MODE = 'mobile';
cb.rest.nodeEnv = process.env.NODE_ENV;
cb.rest.interMode = env.INTERACTIVE_MODE;
cb.rest.terminalType = 3;

cb.route = {
  redirectLoginPage: function () {
    // cb.utils.alert('redirectLoginPage', 'error');
    store.dispatch(replace('/login'))
  },
  refreshIndex: function () {
    store.dispatch(replace('/login'))
    store.dispatch(push('/'))
  },
  pushPage: function (route) {
    store.dispatch(push(route))
  },
  replacePage: function (route) {
    store.dispatch(replace(route))
  },
  goBack: function () {
    store.dispatch(goBack())
  }
};

cb.utils.loading = function (status) {
  store.dispatch({
    type: 'PLATFORM_UI_TOGGLE_LOADING_BAR_STATUS',
    status
  })
}

// if (cb.utils.isEmpty(localStorage.getItem('loginUser')) ) {
//   store.dispatch(push('/login'))
// } else {
//   store.dispatch({
//     type: Actions.USER_SET_DATA,
//     payload: JSON.parse(localStorage.getItem('loginUser'))
//   })
//   if(!cb.utils.isEmpty(localStorage.getItem('defaultStore'))){
//       store.dispatch({type: Actions.USER_ACCOUNT_CHANGE_STORE,payload: JSON.parse(localStorage.getItem('defaultStore'))})
//   }
//   store.dispatch(push('/'))
// }

const fromBrowser = process.env.__APP__ == null;
if (!fromBrowser) {
  cb.rest.ContextBuilder = {
    construct: function () {
      cb.rest.AppContext = {
        serviceUrl: 'http://uretailmobile.yonyouup.com',
        token: localStorage.getItem('token')
      };
    }
  };
  cb.rest.ContextBuilder.construct();
}

// if (navigator.userAgent.match(/(Android);?[\s\/]+([\d.]+)?/) || store.getState().user.toJS().device === 'test')
//   cb.rest.device = 'android';
// 兼容处理fetch问题
cb.rest.mode = 'xhr';
const renderDOm = () => {
  ReactDOM.render(
    <Provider store={store}>
      <div>
        <Loading />
        <Router
          history={history}
        />
      </div>

    </Provider>,
    document.getElementById('container')
  )
}
if (pathname !== '/login') {
  if (fromBrowser) {
    store.dispatch(afterLogin((err) => {
      if (err) {
        cb.route.redirectLoginPage();
        renderDOm();
        return;
      }
      if (pathname.indexOf('/changePwd') < 0 && pathname.indexOf('/meta') < 0)
        cb.route.replacePage('/');
      renderDOm();
    }))
  } else {
    renderDOm();
    cb.route.redirectLoginPage();
  }
}else{
  renderDOm();
}

if (module.hot) {
  module.hot.accept()
}
