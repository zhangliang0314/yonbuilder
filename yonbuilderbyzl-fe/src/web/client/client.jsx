import '@babel/polyfill'
import React from 'react'
import ReactDOM from 'react-dom'
import Immutable from 'immutable'
import { match } from 'react-router'

import cb from '@mdf/cube/lib/cube'
import {Locale} from '@mdf/baseui/lib'
import '@mdf/cube/lib/helpers/polyfill'
import { UretailAlert, UretailConfirm } from '@mdf/metaui-web/lib/components/common/UretailNotice';
import Isomorph from '../common/redux/Isomorph'
import { proxy } from '@mdf/cube/lib/helpers/util';
import routes from '../common/routes'
import { init, logout } from '@mdf/metaui-web/lib/redux/user';// 注意：此处不应该引用mdf包内user，应该引用脚手架内scr/common/extends/user

import './styles';

const finalState = {}
const {
  routing,
  ...reducers
} = window.__INITIAL_STATE__ || {}

if (reducers) {
  for (const p in reducers) {
    const reducer = reducers[p]
    finalState[p] = Immutable.fromJS(reducer)
  }
}

const rootElement = document.getElementById('container')
const { pathname, search, hash } = window.location
const location = `${pathname}${search}${hash}`

const store = Isomorph.createStore('index', finalState)
const history = Isomorph.createHistory(store, pathname)

const render = () => {
  match({ routes, location }, (error, redirectLocation, renderProps) => {
    if(Locale && process.env.__LANG__ && process.env.__LANG__ == true) {
      ReactDOM.render(<Locale><Isomorph store={store} history={history} routes={routes} /></Locale>, rootElement)
    }else{
      ReactDOM.render(<Isomorph store={store} history={history} routes={routes} />, rootElement)
    }
  })
}

cb.utils.confirm = UretailConfirm();
cb.utils.alert = UretailAlert();

cb.route.redirectLoginPage = (confirm) => {
  if (confirm === false) {
    store.dispatch(logout(history));
    return;
  }
  cb.utils.confirm('登录令牌失效，即将跳转登陆页面？', () => {
    store.dispatch(logout(history));
  }, () => {
    cb.utils.loadingControl.end();
  });
}
cb.route.pushPage = (route) => {
  history.push(route);
}


cb.rest.invokeFunction = function (id, data, callback,options)  {
  var proxy = cb.rest.DynamicProxy.create({
    doProxy: {
      url: "/web/function/invoke/" + id,
      method: "POST",
      options: options
    }
  });
  if (options && params.async === false) {
    const ajaxResult = proxy.doProxy(data);
    if (ajaxResult) callback(ajaxResult.error, ajaxResult.result); 
  } else {
    proxy.doProxy(data, callback);
  }
  }



if (navigator.userAgent.match(/(Android);?[\s/]+([\d.]+)?/))
  cb.rest.device = 'android';

const config = {
  url: 'test/fetch',
  method: 'GET',
  options: { uniform: false, token: false }
};
proxy(config)
  .then(json => {
    if (json.code === 500)
      cb.rest.mode = 'xhr';
    if (pathname !== '/login') {
      store.dispatch({ type: 'PLATFORM_UI_USER_INIT' });
      store.dispatch(init());
    }
    render();
  });
