import React from 'react'
import { Route, Router as RouterComponent } from 'react-router'
import { App } from '../containers/App/Index'
import { LoginContainer } from '../containers/Login'
import PortalTabItem from '@mdf/metaui-mobile/lib/components/Portal/PortalTabItem';
import DynamicView from '@mdf/metaui-mobile/lib/components/Portal/DynamicView';
import { VoucherRefer, HeaderInfo, ItemInfo } from '@mdf/metaui-mobile/lib/components/Meta';

import SettleDetail from '../containers/SettleDetail'
import SetReceipts from '../containers/SettleDetail/SetReceipts'
import SettleResult from '../containers/SettleDetail/SettleResult'
import PayContinue from '../components/SettleDetail/PayContinue'
import { ProductsDetailListContainer } from '../containers/SettleDetail/ProductsDetail'
import { MenuContainer } from '../containers/Menu'
import SubMenuContainer from '../containers/Menu/SubMenu';
import { ForgetContainer } from '../containers/Forget'
import GoodsRefer from '../containers/GoodsRefer';
import BillingTouch from '../containers/BillingTouch';
import EditRow from '../containers/EditRow';
import BillingRefer from '../containers/BillingRefer';
import Promotion from '../containers/Promotion';
import Coupon from '../containers/Coupon';
import ScanCode from '../containers/Scan/scan';
import InputCode from '../containers/Scan/hand';
import { ConnectedScanBar } from '../containers/Scan/scanBar';
import ScanBarcode from '../containers/Scan/scanBarCode';
import ChangePwd from '../components/Mine/changePwd';
import VersionInfo from '../components/Mine/version';
import ModifyInfo from '../components/Mine/modifyInfo';
import Department from '../components/Mine/department';
import Region from '../components/Region';
import Reserve from '../containers/Reserve'
import EditReserve from '../containers/Reserve/editReserve'
import ReserveInfo from '../containers/Reserve/reserveInfo'
import ReserveDetail from '../containers/Reserve/reserveDetail'
import BackBills from '../containers/BackBill'
import BackBillInfo from '../containers/BackBill/BackBillInfo'
import BackReason from '../containers/BackBill/BackReason'
import { MobileReport } from '@mdf/metaui-mobile/lib/components/echart/MobileReport';
import { MessageCenter } from '../containers/MessageCenter';

export class Router extends React.Component {
  render () {
    return (
      <RouterComponent history={this.props.history}>
        <Route exact path='/' component={App} />
        <Route path='/login' component={LoginContainer} />
        <Route exact path='/meta/:menuId' component={PortalTabItem} />
        <Route exact path='/meta/:billtype/:billno' component={DynamicView} />
        <Route path='/meta/:billtype/:billno/:billid' component={DynamicView} />
        <Route path='/voucherRefer/:menuId/:itemName/(:parentItem)' component={VoucherRefer} />
        <Route path='/voucherRefer/:menuId/:itemName' component={VoucherRefer} />
        <Route path='/headerInfo/:menuId' component={HeaderInfo} />
        <Route path='/itemInfo/:itemIndex/:menuId' component={ItemInfo} />

        <Route path='/expire' component={LoginContainer} />
        <Route exact path='/menu' component={MenuContainer} />
        <Route path='/menu/:menuId' component={SubMenuContainer} />
        <Route path='/forget' component={ForgetContainer} />
        <Route path='/billing' component={BillingTouch} />
        <Route path='/refer' component={GoodsRefer} />
        <Route path='/settleDetail' component={SettleDetail} />
        <Route path='/setReceipts' component={SetReceipts} />
        <Route path='/settleResult' component={SettleResult} />
        <Route path='/payContinue' component={PayContinue} />
        <Route path='/productsDetailList' component={ProductsDetailListContainer} />
        <Route path='/editRow/:rowIndex' component={EditRow} />
        <Route path='/billingRefer' component={BillingRefer} />
        <Route path='/promotion' component={Promotion} />
        <Route path='/coupon' component={Coupon} />
        <Route path='/scanCode' component={ScanCode} />
        <Route path='/scan' component={ConnectedScanBar} />
        <Route path='/scanBarcode/:reduxName' component={ScanBarcode} />
        <Route path='/inputCode' component={InputCode} />
        <Route path='/changePwd' component={ChangePwd} />
        <Route path='/changePwd/:token' component={ChangePwd} />
        <Route path='/version' component={VersionInfo} />
        <Route path='/mdfInfo' component={ModifyInfo} />
        <Route path='/department' component={Department} />
        <Route path='/reserve' component={Reserve} />
        <Route path='/region' component={Region} />
        <Route path='/editreserve' component={EditReserve} />
        <Route path='/reserveInfo' component={ReserveInfo} />
        <Route path='/reverseDetail' component={ReserveDetail} />

        <Route path='/backbills' component={BackBills} />
        <Route path='/backbillinfo' component={BackBillInfo} />
        <Route path='/backreason' component={BackReason} />
        <Route path='/mobileReport' component={MobileReport} />
        <Route path='/messageCenter' component={MessageCenter} />
      </RouterComponent>);
  }
}
