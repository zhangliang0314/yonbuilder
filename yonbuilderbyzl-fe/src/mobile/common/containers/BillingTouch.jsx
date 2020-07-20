import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { push, goBack } from 'react-router-redux'
import { Popover, Icon, Flex, SwipeAction, Checkbox, Button } from 'antd-mobile';
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar';
import * as billingActions from '../reducers/modules/billing'
import * as reserveActions from 'src/common/redux/modules/billing/reserve'
import * as uretailHeaderActions from 'src/common/redux/modules/billing/uretailHeader'
import * as referActions from '../reducers/modules/goodsRefer'
import * as configActions from 'src/common/redux/modules/billing/config'
import * as unsubscribeActions from 'src/common/redux/modules/billing/unsubscribe'
import { deleteProduct, mobileReferCanOpen, setOptions, setFocusedRow } from 'src/common/redux/modules/billing/product'
import { checkQuantity } from 'src/common/redux/modules/billing/quote'
import { MemberBoxClear } from 'src/common/redux/modules/billing/member'
import { clear } from 'src/common/redux/modules/billing/mix'
import SettleInfoBar from 'src/common/containers/SettleInfoBar'
import { getFixedNumber } from 'src/common/redux/modules/billing/paymode'
import Member from '../components/Member/index'
import ChangeSpecModal from './ChangeSpecMoal'
import StepperSelf from '@mdf/metaui-mobile/lib/components/common/Stepper'
import Operator from './Operator'
// require('@mdf/theme-mobile/theme/billing.css')
const Item = Popover.Item;
const CheckboxItem = Checkbox.CheckboxItem

const getStringLength = (str) => {
  if (!str) str = '';
  let realLength = 0; const len = str.length; let charCode = -1;
  for (var i = 0; i < len; i++) {
    charCode = str.charCodeAt(i);
    if (charCode >= 0 && charCode <= 128) {
      realLength += 1;
    } else {
      realLength += 2;
    }
  }
  return realLength
}

class BillingTouch extends Component {
  constructor (props) {
    super(props)
    this.state = { nofromstatus: false };
  }

  componentDidMount () {
    const { billingActions, uretailHeader, history, billing, reserveActions, reserve } = this.props;
    if (uretailHeader.billingStatus === 'CashSale' || uretailHeader.billingStatus === 'NoFormerBackBill') {
      const { init } = billingActions;
      init(uretailHeader.billingStatus);
    }
    this.handleTouch(true);

    if (uretailHeader.billingStatus === 'PresellBill') {
      let isInitBusinessType = true;
      if (!cb.utils.isEmpty(reserve.businessType.id + '')) {
        isInitBusinessType = false;
      }
      reserveActions.getBusinessType(true, '', isInitBusinessType);
    }

    window.webViewEventHand.addEvent('BillingTouchBack', function (callback) {
      this.NavBarLeftClick();
    }.bind(this));

    if (history.location.state === 'newReserveBill' && billing.isAgainBilling) {
      this.props.billingActions.setOptions({ isAgainBilling: false })
      this.newReserve();
    }
  }

  componentWillUnmount () {
    this.handleTouch(false);
    this.props.MemberBoxClear('');
    window.webViewEventHand.cancelEvent(null);
  }

  handleTouch (init) {
    var startX, startY, moveEndX, moveEndY, X, Y;
    const touchstartFunc = function (e) {
      startX = e.touches[0].pageX;
      startY = e.touches[0].pageY;
    }
    const touchEndFunc = function (e) {
      moveEndX = e.changedTouches[0].pageX;
      moveEndY = e.changedTouches[0].pageY;
    }
    const touchMoveFunc = (e) => {
      if (!this.listDom) return;
      moveEndX = e.changedTouches[0].pageX;
      moveEndY = e.changedTouches[0].pageY;
      X = moveEndX - startX;
      Y = moveEndY - startY;
      if ((Math.abs(Y) <= Math.abs(X)) || Math.abs(Y) < 5) return
      if (this.listDom.scrollTop > 105) {
        this.props.billingActions.setOptions({ isTop: true })
        console.log(this.listDom.scrollTop)
        console.log('this is reading top')
      } else {
        this.props.billingActions.setOptions({ isTop: false })
        console.log(this.listDom.scrollTop)
        console.log('不吸顶')
      }
    }
    if (!init) {
      window.removeEventListener('touchstart', touchstartFunc);
      window.removeEventListener('touchmove', touchMoveFunc);
      window.removeEventListener('touchend', touchEndFunc);
      return
    }
    window.addEventListener('touchstart', touchstartFunc);
    window.addEventListener('touchmove', touchMoveFunc);
    window.addEventListener('touchend', touchEndFunc);
  }

  onEditRow = (index, bDeliveryModify, product) => {
    const { billingStatus } = this.props.allState.uretailHeader.toJS();
    const { products } = this.props.product;
    const focusedRow = products[index];
    this.props.setFocusedRow(focusedRow);
    if (billingStatus === 'NoFormerBackBill' || billingStatus === 'FormerBackBill') {
      this.props.configActions.executeAction('EditRow');
    }
    this.props.dispatch(push('/editRow/' + index, bDeliveryModify));
  }

  /* 新开单或者进入编辑状态 */
  onFunctionSelect (opt, ctx, type) {
    const { billingStatus } = this.props.allState.uretailHeader.toJS();
    if (type === 'new' && (billingStatus === 'PresellBill' || billingStatus === 'Shipment')) {
      this.newReserve();
      return;
    }

    const action = ctx.props.billingActions;
    if (opt.props.value === 'newBilling' || opt.props.value === 'ExitPresellBill') {
      // 新开单
      this.props.clear();
      this.props.billingActions.setOptions({ reBillingVisible: false })
    }
    if (opt.props.value === 'edit') {
      action.setOptions({ navBarState: 'edit' })
    }
  }

  /** **新开预定单 ***/
  newReserve () {
    const { reserve, clear, uretailHeaderActions, reserveActions } = this.props;
    clear();
    let businessTypeId = 0;
    const val = {};
    uretailHeaderActions.ModifyBillStatus('PresellBill');
    if (reserve.Businesstype_DataSource.length > 0) {
      const businesstypeObj = reserve.Businesstype_DataSource[0];
      businessTypeId = businesstypeObj.id;
      val.businessType = { id: businessTypeId, name: businesstypeObj.name };
      // let takeWay = { id: 1, name: '门店自提' };
      const isDistribCenter = businesstypeObj.isDistribCenter;
      // if (isDistribCenter) takeWay = { id: 2, name: '中心配送' };
      val.bDeliveryModify = businesstypeObj.isUpdItemBySend;
      val.bPreselllockStock = businesstypeObj.isPreCalcBalance;
      val.MinPercentGiveMoneyPre = businesstypeObj.MinPercentGiveMoneyPre;
      val.takeWay = reserve.takeWay_DataSource[0];
      val.isDistribCenter = isDistribCenter;
      val.bReserve = true;
      val.check = false;
      reserveActions.setCommonData(val);
    } else {
      reserveActions.setCommonData({ check: true });
    }
    reserveActions.modify();
  }

  /* 编辑态改变商品规格 */
  eiditSpecClick (product) {
    // console.log("获取"+id+"下的skuid")
    this.props.setFocusedRow(product)
    this.props.referActions.setOptions({ visible: true, currentPorduct: product })
    this.props.referActions.selectSpec(product.product, product)
  }

  /* 编辑状态是否完成 */
  isEditClick (type) {
    const status = type === 'edit' ? 'edit' : 'default';
    if (status === 'default')
      this.props.billingActions.setOptions({ eiditDeleteMap: {} })
    this.props.billingActions.setOptions({ navBarState: status })
  }

  /* 修改商品数量 */
  modifyQuantityClick (product, num) {
    const { billingStatus } = this.props.allState.uretailHeader.toJS();
    if ((billingStatus === 'NoFormerBackBill' || billingStatus === 'FormerBackBill') && product.fQuantity < 0) {
      if (num >= 0) {
        num = -1;
      }
    }
    this.props.checkQuantity(num, product)
  }

  /* 开单删除商品 */
  productDelete (key, deleteChecked) {
    const { products } = this.props.product;
    const { eiditDeleteMap } = this.props.billing;
    if (!key && deleteChecked) { // 编辑态删除所选商品
      const str = JSON.stringify(eiditDeleteMap);
      if (str.length <= 2) {
        // this.props.billingActions.setOptions({ navBarState: 'default'})
        return
      }
      for (const attr in eiditDeleteMap) {
        const currentPorduct = products.find(ele => {
          return ele.key == attr
        })
        if(!currentPorduct) continue
        eiditDeleteMap[currentPorduct.key] && this.props.deleteProduct(currentPorduct.key, true)
      }
    } else
      this.props.deleteProduct(key, true)
    /* this.props.billingActions.setOptions({eiditDeleteMap: {}}) */
  }

  /* 开单编辑状态eiditDeleteMap控制 */
  editStateDelete (e, key, checkAll) {
    const { eiditDeleteMap } = this.props.billing;
    const { products } = this.props.product;
    const checked = e.target.checked;
    if (!key && checkAll) {
      products.forEach(product => {
        eiditDeleteMap[product.key] = checked
      })
      this.props.billingActions.setOptions({ eiditDeleteMap });
      return
    }
    eiditDeleteMap[key] = checked;
    this.props.billingActions.setOptions({ eiditDeleteMap });
  }

  /* 判断checkBox是否选中 */
  judgeCheckBox (key, isAll) {
    const { eiditDeleteMap } = this.props.billing;
    const { products } = this.props.product;
    const length = products.length; let num = 0;
    if (!key && isAll) {
      for (const attr in eiditDeleteMap) {
        if (eiditDeleteMap[attr])
          num += 1
      }
      const checked = num == length;
      return checked
    } else {
      return !!eiditDeleteMap[key]
    }
  }

  /* 进入选择商品参照 */
  enterGoodsRefer () {
    // if(this.props.mobileReferCanOpen())
    this.props.dispatch(push('refer'))
  }

  /* 进入扫码界面 */
  enterScan () {
    // if(this.props.mobileReferCanOpen())
    this.props.dispatch(push('/scanCode'))
  }

  /* 获取功能拦的状态（选择商品，扫码录入） */
  getFunctionBarState () {
    const { products } = this.props.product;
    const { bHasMember } = this.props.member;
    const num = products.length;
    let functionBarState, functionBarStyle;
    if (num > 0) {
      functionBarState = 'origin'
      functionBarStyle = 'billing_mast_function_second'
    } else {
      functionBarState = 'productsNoProduct'
      functionBarStyle = ''
    }
    if(bHasMember) functionBarStyle += ' billing_mast_function_second_member'
    return { functionBarState, functionBarStyle }
  }

  /* 算该死的字符串长度 */
  getSpecStyleWidth (str, outSide) {
    // 每个汉子rem
    const num = getStringLength(`规格：${str}`)
    if (outSide) {
      // return (document.documentElement.clientWidth - 2.9 * window.__fontUnit);
      return num > 30 ? ((30 * 0.135 - 0.29) * window.__fontUnit) : ((num * 0.135 - 0.29) * window.__fontUnit)
    }
    const width = num > 30 ? 30 * 0.135 : num * 0.135;

    return width * window.__fontUnit
  }

  /* 导航栏左侧点击事件 */
  NavBarLeftClick () {
    const { navBarState } = this.props.billing;
    const { uretailHeader, history } = this.props;
    // 从结算成功页跳转到此，再返回就让它去首页
    if (history.location.state === 'newReserveBill' || history.location.state === 'newBill') {
      if (history.location.state === 'newReserveBill') {
        this.onFunctionSelect({ props: { value: 'ExitPresellBill' } }, this);
      }
      this.props.dispatch(push('/'))
      return;
    }
    if (navBarState === 'default') {
      this.props.dispatch(goBack())
      if (uretailHeader.billingStatus !== 'CashSale') {
        this.onFunctionSelect({ props: { value: 'ExitPresellBill' } }, this);
      }
    }
    else if (navBarState === 'reserve') {
      this.props.dispatch(push('/reserve'))
    }
    // if(navBarState === 'edit')
    //     this.props.billingActions.setOptions({ navBarState: 'default'})
  }

  /** 是否预定 */
  isReservestatus () {
    const { infoData } = this.props.allState.uretailHeader.toJS();
    if (infoData.billNo) {
      return infoData.bDeliveryModify;
    }
    return true;
  }

  /* NavBar右侧内容 */
  getRightContent () {
    const { navBarState, reBillingVisible } = this.props.billing;
    const { billingStatus } = this.props.allState.uretailHeader.toJS();
    const { products } = this.props.product;
    const defaultStr = <div className='edit-count'>
      {/* <span className="billing_add_member" onClick={() => this.addNewMember()}>新增会员</span> */}
      {!this.isReservestatus() ? '' : products.length > 0 ? <span className='edit-left' onClick={() => this.onFunctionSelect({ props: { value: 'edit' } }, this)}>编辑</span> : ''}
      {(billingStatus === 'Shipment' || billingStatus === 'PresellBack')
        ? ''
        : <Popover
          overlayClassName='fortest'
          overlay={[
            (<Item key='newBilling' value='newBilling'><i className='icon icon-xinkaidan' />新开单</Item>), ]}
          onSelect={(opt) => this.onFunctionSelect(opt, this, 'new')}
          visible={reBillingVisible}
        >
          <div><Icon type='icon-gengduo' /></div>
        </Popover>
      }
    </div>
    const doneStr = <div className='billing_nav_right'>
      <span className='navBar_done' onClick={() => this.isEditClick('default')}>完成</span>
    </div>
    return navBarState === 'default' ? defaultStr : doneStr
  }

  /* 商品行列表 */
  getProductList () {
    const { products } = this.props.product;
    const { navBarState } = this.props.billing;
    const { billingStatus } = this.props.allState.uretailHeader.toJS();
    const arr = []
    products.forEach((product, index) => {
      let stepProps = { min: 1 };
      if ((billingStatus === 'NoFormerBackBill' || billingStatus === 'FormerBackBill') && product.fQuantity < 0) {
        stepProps = { min: 0 - product.fCanCoQuantity, max: -1 };
      }
      const row = navBarState === 'default'
        ? <SwipeAction
          autoClose
          right={[
            // {
            //     text: '取消',
            //     onPress: () => console.log('cancel'),
            //     style: { backgroundColor: '#ddd', color: 'white' },
            // },
            {
              text: '删除',
              onPress: () => this.productDelete(product.key),
              style: { backgroundColor: '#F4333C', color: 'white' },
            },
          ]}
        >
          <div>
            <div className='billing_product_left refer_product_img'>{(product.productAlbums && product.productAlbums.length > 0) ? <img src={product.productAlbums[0].murl} alt='图片' /> : <Icon type='icon-morentupiancopy' />}</div>
            <div className='billing_product_right'>
              <div className='billing_product_name'>
                <span className='billing_product_name-title'>{product.product_cName}</span>
                <span className='diverted-icon' onClick={() => this.onEditRow(index, this.isReservestatus(), product)}><Icon type='icon-edit' /></span>
              </div>
              <div className='billing_product_spec'>{product.specs ? `规格： ${product.specs}` : ''}</div>
              <div className='billing_product_money'>
                <span className='billing-product-price'><span>¥</span>{getFixedNumber(product.fPrice, 'monovalentdecimal')}</span><span className='iEmployeeid_name'>{false && (<i>营</i>)}{''}</span>
                {/* <span>数量{product.fQuantity}</span> */}
              </div>
              <div className='num-1'>
                {!this.isReservestatus() ? <span className='billing-product-num'><em>X</em>{product.fQuantity}</span> : <StepperSelf
                  style={{ width: '100%', minWidth: '100px' }}
                  showNumber
                  {...stepProps}
                  value={product.fQuantity}
                  onChange={(num) => this.modifyQuantityClick(product, num)}
                />}
              </div>
            </div>
          </div>
        </SwipeAction>
        : <CheckboxItem checked={this.judgeCheckBox(product.key)} className={this.judgeCheckBox(product.key) ? 'product_active' : ''} onChange={(e) => this.editStateDelete(e, product.key)}>
          <div className='edite-product'>
            <div className='billing_product_left refer_product_img'>{(product.productAlbums && product.productAlbums.length > 0) ? <img src={product.productAlbums[0].murl} alt='图片' /> : <Icon type='icon-morentupiancopy' />}</div>
            <div className='billing_product_right'>
              <div className='billing_product_edit_name'>{product.product_cName}</div>
              {(product.specs && product.productskus) ? <div className='billing_product_spec_edit' style={{ width: this.getSpecStyleWidth(product.specs, true) }}>
                <div className='edite-product-name' onClick={() => this.eiditSpecClick(product)} style={{ width: this.getSpecStyleWidth(product.specs) }}>规格：{product.specs}</div>
                {!this.isReservestatus() ? '' : <span><Icon type='icon-zhakai' /></span>}
              </div> : null}
              <div className='billing_product_null' />
              <div className='billing_product_money'>
                <span className='billing-product-price'><span>¥</span>{getFixedNumber(product.fPrice, 'monovalentdecimal')}<span className='billing_product_money'>{false && (<i>营</i>)}{''}</span></span>
                {/* <span>数量{product.fQuantity}</span> */}
                {!this.isReservestatus() ? <span>X{product.fQuantity}</span> : <StepperSelf
                  style={{ width: '100%', minWidth: '100px' }}
                  showNumber
                  {...stepProps}
                  value={product.fQuantity}
                  onChange={(num) => this.modifyQuantityClick(product, num)}
                />}

              </div>
            </div>
          </div>
        </CheckboxItem>
      arr.push(row)
    })
    return <div ref={(node) => { this.listFather = node }} className='listFather'>{arr}<ChangeSpecModal where='billing' /></div>
  }

  /** 退货商品复选框 */
  returnSaleChange (bl) {
    this.props.setOptions({ backBill_checked: bl });
  }

  /* 底部功能区 */
  getFooterContent () {
    const { navBarState } = this.props.billing;
    // let { products } = this.props.product;

    // let num = 0, money = 0;
    // products.forEach(product => {
    //   num += product.fQuantity;
    //   money += product.fMoney;
    // })
    const str = navBarState === 'default'
      ? <div>
        {/* <List>
                    <List.Item extra="现销" arrow='horizontal'>
                        业务类型
                    </List.Item>
                    <InputItem value={memoValue || ''} placeholder="请输入"
                        clear onChange={(value) => this.memoChange(value)}>备注</InputItem>
                </List> */}
        <SettleInfoBar />
      </div>
      : <div className='billing_footer_edit'>
        <span className='edit-all-select'><Checkbox checked={this.judgeCheckBox(null, true)} onChange={(e) => this.editStateDelete(e, null, true)}>全选</Checkbox></span>
        <Button onClick={() => this.productDelete(null, true)}>删除所选</Button>
      </div>
    return str
  }

  /* 开单扫码按钮功能区域不同UI展现 */
  getFunctionBarComponent () {
    const { billingStatus } = this.props.allState.uretailHeader.toJS();
    const { nofromstatus } = this.state;
    const { backBill_checked } = this.props.product;
    if (!this.isReservestatus()) {
      return null;
    }
    const { functionBarState, functionBarStyle } = this.getFunctionBarState();
    if (functionBarState === 'origin') {
      return (
        <div className={`${functionBarStyle} billing_mast_function`}>
          <div className='billing_add_product' onClick={() => this.enterGoodsRefer()}>
            <span />
            <Button><span className='xiaolingsui' style={{ width: ((billingStatus === 'NoFormerBackBill' && !nofromstatus && backBill_checked) ? '1.68' : '1.12') + 'rem' }} /><span>选择{(billingStatus === 'NoFormerBackBill' && !nofromstatus && backBill_checked) ? '退货' : ''}商品</span></Button>
          </div>
          <div className='billing_scan' onClick={() => this.enterScan()}>
            <span />
            <Button><span className='xiaolingsui' />扫码录入</Button></div>
        </div>
      )
    }
    if (functionBarState === 'productsNoProduct') {
      return (
        <div className={`${functionBarStyle} billing_mast_function`}>
          <div className='billing-line' />
          <div className='billing_add_product' onClick={() => this.enterGoodsRefer()}><Button><span>选择{(billingStatus === 'NoFormerBackBill' && !nofromstatus && backBill_checked) ? '退货' : ''}商品</span></Button><div className='billing-select-product' /></div>
          <div className='billing_scan' onClick={() => this.enterScan()}><Button>扫码录入</Button><div className='scavenging-entry' /></div>
        </div>
      )
    }
  }

  noFormBackTitleView () {
    const { nofromstatus } = this.state;
    const { backBill_checked } = this.props.product;
    return (
      <div className='non-original-return-top'>
        <div onClick={() => { this.setState({ nofromstatus: !nofromstatus }); }}>非原单退货<i className={nofromstatus ? 'icon icon-shouqi ' : 'icon icon-zhakai'} /></div>
        <div onClick={() => { this.setState({ nofromstatus: !nofromstatus }); }} style={{ flexFlow: 'row', height: '100%', width: '100%', zIndex: '11111113', position: 'absolute', left: '0', background: 'rgba(255,255,255,0.9)', display: (nofromstatus ? 'block' : 'none') }}>
          <div className='non-original-return-xiala'>
            <Flex><Flex.Item><Button onClick={(e) => { e.preventDefault(); this.returnSaleChange(true) }} className={backBill_checked ? '' : 'non-original-return-btn'}>退货商品</Button></Flex.Item><Flex.Item><Button onClick={(e) => { e.preventDefault(); this.returnSaleChange(false) }} className={!backBill_checked ? '' : 'non-original-return-btn'}>商品</Button></Flex.Item></Flex>
          </div>
          <div style={{ flex: '1', width: '100%', backgroundColor: '#ddd' }} />
        </div>
      </div>
    )
  }

  render () {
    const { billingStatus } = this.props.allState.uretailHeader.toJS();
    const { bHasMember } = this.props.member;
    const listArr = this.getProductList();
    const rightContent = this.getRightContent();
    const footContent = this.getFooterContent();
    const functionBarComponent = this.getFunctionBarComponent();
    const { isTop, navBarState } = this.props.billing;
    const clientHeight = window.screen.height;
    let height = clientHeight ? (isTop ? (clientHeight - (1 + 1.1 + 0.98) * window.__fontUnit) : (clientHeight - (3.3 + 1.1 + 0.98) * window.__fontUnit)) : 0
    const editHeight = clientHeight ? (clientHeight - (1.28 + 0.98) * window.__fontUnit - 10) : 0
    if (!this.isReservestatus()) {
      height = height + 2.02 * window.__fontUnit;
    } else {
      height = height + 1.32 * window.__fontUnit;
    }

    const { products } = this.props.product;
    let scrollClass = 'billing_product_container';
    let topbgcls = '';
    if(!this.isReservestatus())
      scrollClass += ' Delivery_no'
    if(bHasMember) {
      scrollClass += ' HasMember'
      topbgcls += ' nohasmember'
    }
    if(isTop && billingStatus != 'Shipment')
      scrollClass += ' Mounting'
    if(products.length > 0)
      scrollClass += ' Hasproduct'
    if(navBarState === 'edit')
      scrollClass += ' Edit'
    if(billingStatus == 'Shipment')
      scrollClass += ' Shipment'

    let title = '开单';
    if (billingStatus === 'PresellBill' || billingStatus === 'Shipment') {
      title = '开单-预订'
      if(this.isReservestatus()) {
        topbgcls += billingStatus === 'Shipment' ? ' noreserve' : ' nopresellbill'
      }
      if(!bHasMember && products.length <= 0) {
        topbgcls = ' noempty'
      }
    } else if (billingStatus === 'NoFormerBackBill') {
      title = this.noFormBackTitleView();
    } else if (billingStatus === 'FormerBackBill') {
      title = '原单退货'
    }
    if (billingStatus === 'FormerBackBill') {
      if (!bHasMember) {
        height = height + (0.68 * window.__fontUnit) + (1.1 * window.__fontUnit);
        scrollClass += ' FormerBacknoMember';
      }else{
        scrollClass += ' FormerBackhavaMember';
      }
    }

    if(isTop) {
      cb.utils.setStatusBarStyle('dark');
    }

    if (billingStatus == 'Shipment') {
      return (
        <div className=''>
          <div className={(billingStatus === 'FormerBackBill' && !bHasMember) ? (navBarState === 'edit' ? 'billing_top_bg_edtu' : 'billing_top_bg2 ') : ('billing_top_bg ' + topbgcls)}>
            <NavBar color='#fff' icon={navBarState === 'edit' ? 'kong' : ''} onLeftClick={() => this.NavBarLeftClick()} title={title} rightContent={rightContent} />
            <div className={navBarState === 'edit' ? 'display_none' : ''}>
              {(billingStatus === 'Shipment' || billingStatus === 'FormerBackBill') ? (bHasMember ? <Member /> : <span className='backbill-margin' />) : <Member />}
              {functionBarComponent}
            </div>
          </div>
          {navBarState === 'default'
            ? <div ref={node => { this.listDom = node }} style={{ height, overflow: 'auto' }} className={scrollClass}>{listArr}</div>
            : <div style={{ height: editHeight, overflow: 'auto' }} className={scrollClass}>{listArr}</div>}
          <div className='billing_footer_container'>{footContent}</div>
          <Operator />
        </div>
      )
    }

    return (<div className={isTop ? 'topMove' : ''}>
      {!isTop ? <div className={(billingStatus === 'FormerBackBill' && !bHasMember) ? (navBarState === 'edit' ? 'billing_top_bg_edtu' : 'billing_top_bg2 ') : ('billing_top_bg ' + topbgcls)}>
        <NavBar color='#fff' icon={navBarState === 'edit' ? 'kong' : ''} onLeftClick={() => this.NavBarLeftClick()} title={title} rightContent={rightContent} />
        <div className={navBarState === 'edit' ? 'display_none' : ''}>
          {(billingStatus === 'Shipment' || billingStatus === 'FormerBackBill') ? (bHasMember ? <Member /> : <span className='backbill-margin' />) : <Member />}
          {functionBarComponent}
        </div>
      </div> : functionBarComponent}
      {navBarState === 'default'
        ? <div ref={node => { this.listDom = node }} style={{ overflow: 'auto' }} className={scrollClass}>{listArr}</div>
        : <div style={{ overflow: 'auto' }} className={scrollClass}>{listArr}</div>}
      <div className='billing_footer_container'>{footContent}</div>
      <Operator />
    </div>
    );
  }
}

function mapStateToProps (state) {
  return {
    user: state.user.toJS(),
    product: state.product.toJS(),
    billing: state.billing.toJS(),
    member: state.member.toJS(),
    uretailHeader: state.uretailHeader.toJS(),
    unsubscribe: state.unsubscribe.toJS(),
    reserve: state.reserve.toJS(),
    allState: state,
  };
}

function mapDispatchToProps (dispatch) {
  return {
    configActions: bindActionCreators(configActions, dispatch),
    unsubscribeActions: bindActionCreators(unsubscribeActions, dispatch),
    billingActions: bindActionCreators(billingActions, dispatch),
    deleteProduct: bindActionCreators(deleteProduct, dispatch),
    clear: bindActionCreators(clear, dispatch),
    MemberBoxClear: bindActionCreators(MemberBoxClear, dispatch),
    referActions: bindActionCreators(referActions, dispatch),
    mobileReferCanOpen: bindActionCreators(mobileReferCanOpen, dispatch),
    reserveActions: bindActionCreators(reserveActions, dispatch),
    uretailHeaderActions: bindActionCreators(uretailHeaderActions, dispatch),
    setOptions: bindActionCreators(setOptions, dispatch),
    setFocusedRow: bindActionCreators(setFocusedRow, dispatch),
    checkQuantity: bindActionCreators(checkQuantity, dispatch),
    dispatch,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(BillingTouch)
