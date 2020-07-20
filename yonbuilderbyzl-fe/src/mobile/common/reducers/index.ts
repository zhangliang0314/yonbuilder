import { combineReducers } from 'node_modules0/redux';
import todos from './todos';
import loading from './modules/loading';
import tabBar from './modules/tabBar';
import user from '../redux/modules/user';
import { tree } from 'node_modules0/@mdf/metaui-web/lib/redux/tree';
import dashboarddata from './modules/dashboarddata';
import forget from './modules/forget';
import mine from './modules/mine';
import goodsRefer from './modules/goodsRefer';
import orderReserve from './modules/orderReserve'
import billingRefer from './modules/billingRefer';
import billing from './modules/billing';
// import promotion from './modules/promotion';
import barCode from './modules/barCode';
import scanBarcode from './modules/scanBarcode';
import coupon from './modules/coupon';
import point from './modules/point';
import portal from 'node_modules0/@mdf/metaui-web/lib/redux/portal';
import offLine from './modules/offLine';
import messageList from './modules/messageList';

import promotion from '../redux/modules/billing/ExecutPromotion';
import product from '../redux/modules/billing/product';
import mix from '../redux/modules/billing/mix';
import config from '../redux/modules/billing/config';
import salesClerk from '../redux/modules/billing/salesClerk';
import uretailHeader from '../redux/modules/billing/uretailHeader';
import reserve from '../redux/modules/billing/reserve';
import member from '../redux/modules/billing/member';
import editRow from '../redux/modules/billing/editRow';
import paymode from '../redux/modules/billing/paymode';
import operator from '../redux/modules/billing/operator';
import discount from '../redux/modules/billing/discount';
import quote from '../redux/modules/billing/quote';
import unsubscribe from '../redux/modules/billing/unsubscribe'
import backBill from '../redux/modules/billing/backBill';
import actions from '../redux/modules/billing/actions';
import checkMsg from '../redux/modules/billing/checkMsg'
import { routerReducer, RouterState } from 'node_modules0/react-router-redux'


export interface RootState {
  tabBar: TabBarStoreState;
  todos: TodoStoreState;
  // user: UserStoreState;
  router: RouterState;
  // menu: MenuStoreState;
  forget: any;
  dashboarddata: any;
  paymode: any;

}

const reducers = combineReducers<RootState>({
  loading,
  tabBar,
  todos,
  user,
  menu: tree,
  tree,
  goodsRefer,
  product,
  mix,
  config,
  salesClerk,
  uretailHeader,
  member,
  mine,
  forget,
  dashboarddata,
  editRow,
  billingRefer,
  paymode,
  billing,
  promotion,
  coupon,
  barCode,
  scanBarcode,
  operator,
  quote,
  discount,
  point,
  reserve,
  orderReserve,
  unsubscribe,
  portal,
  backBill,
  actions,
  offLine,
  messageList,
  checkMsg,
  router: routerReducer,
  routing: routerReducer,
} as any);

export { reducers }
