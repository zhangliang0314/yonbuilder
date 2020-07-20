import React from 'react'
import { Route } from 'react-router'

// 通用错误页面
import ErrorNotFoundPage from '@mdf/metaui-web/lib/components/errors/NotFound'
import DynamicView from '@mdf/metaui-web/lib/components/portal/DynamicView'
import BussinessMenu from './bussinessMenu';
import DebugScript from './DebugScript';
import RoutesMap from './config.route'

const PREFIX = process.env.__CLIENT__ ? (window._baseUrl || '') : (process.env.PREFIX || '');
const CLIENT = process.env.__CLIENT__;

const renderRoutes = (routes) => {
  return routes.map((route, index) => {
    let _path = route.path;
    if (PREFIX && CLIENT && route.path.indexOf('/') > -1) {
      _path = route.path.replace('/', '');
    }
    if (Array.isArray(route.routes) && route.routes.length > 0) {
      return <Route key={index} exact={route.exact} component={route.component} path={_path}>
        {renderRoutes(route.routes)}
      </Route>
    } else {
      return <Route key={index} exact={route.exact} component={route.component} path={_path} />
    }
  })
}
export default (
  <Route path={CLIENT ? (window._baseUrl || '') : (PREFIX || '')}>
    {renderRoutes(RoutesMap)}
    <Route path='menu' component={BussinessMenu} />
    <Route path='platform/:menuurl' component={DynamicView} />
    <Route path='meta' component={DebugScript}>
      <Route path=':billtype/:billno' component={DynamicView} />
      <Route path=':billtype/:billno/:billid' component={DynamicView} />
    </Route>
    <Route path='*' component={ErrorNotFoundPage} />
  </Route>
)
