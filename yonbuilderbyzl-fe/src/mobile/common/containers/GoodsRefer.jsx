import React, { Component } from 'react';
import {
  Button, PullToRefresh, Accordion,
  List, SearchBar, Modal, Toast, Icon, Badge
} from 'antd-mobile';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { push, goBack } from 'react-router-redux'
import ReactDOM from 'react-dom'
import * as referActions from '../reducers/modules/goodsRefer'
import * as editRowAction from 'src/common/redux/modules/billing/editRow'
import { addProduct, modifyQuantity, setFocusedRow } from 'src/common/redux/modules/billing/product';
import { getFixedNumber } from 'src/common/redux/modules/billing/paymode'
import ChangeSpecModal from './ChangeSpecMoal'
import StepperSelf from '@mdf/metaui-mobile/lib/components/common/Stepper'

require('@mdf/theme-mobile/theme/goodRefer.css')

function genData () {
  const dataArr = [];
  for (let i = 0; i < 20; i++) {
    dataArr.push(i);
  }
  return dataArr;
}
let isbackBillingTouch = false;
class GoodsRefer extends Component {
  constructor (props) {
    super(props)
    this.state = {
      // refreshing: false,
      down: true,
      height: document.documentElement.clientHeight,
      data: [],
    };
    // 设置状态栏字体黑色
    cb.utils.setStatusBarStyle('dark');
  }

  componentWillMount () {
    if (isbackBillingTouch) {
      isbackBillingTouch = false;
      const { salesClerk } = this.props;
      const salesChecked = salesClerk.salesChecked;
      if (salesChecked && salesChecked != '') {
        this.finallyOkClick();
      } else {
        this.cartRowDelete(null, true)
      }
    }
  }

  componentDidMount () {
    // this.props.referActions.getReferData()
    this.didmount = true
    this.props.referActions.getFlatGoodsData(true)
    const hei = this.state.height - ReactDOM.findDOMNode(this.ptr).offsetTop;
    setTimeout(() => this.setState({
      height: hei,
      data: genData(),
    }), 0);
  }

  backClick = () => {
    this.props.dispatch(goBack())
    // 设置状态栏字体白色
    cb.utils.setStatusBarStyle('light');
  }

  startRefresh = () => {
    // setTimeout(() => {
    //   this.setState({ refreshing: false });
    // }, 1000);
    let { pageIndex, treePath, referKeyword, isGetNextData } = this.props.goodsRefer;
    if (!isGetNextData) return
    pageIndex++
    this.props.referActions.setOptions({ refreshing: true, pageIndex })
    this.props.referActions.getFlatGoodsData(false, treePath, { pageIndex }, referKeyword)
  }

  isHaveSpecBtn (product) {
    // let isSku = false;
    let goodsHaveSkuId = false;
    for (const attr in product) { // eslint-disable-line no-unused-vars
      if (product.skuId) goodsHaveSkuId = true
    }
    /* sku页签>商品页签有无skuid */
    const isHave = !goodsHaveSkuId;
    return isHave
  }

  accordionChange (path) {
    console.log('accordion onChange' + path)
    // let { referKeyword } = this.props.goodsRefer;
    this.props.referActions.setOptions({ treePath: path, pageIndex: 1, accordionKey: path });
    this.props.referActions.getFlatGoodsData(false, path, false, '')
  }

  listOnclick (path) {
    // let { referKeyword } = this.props.goodsRefer;
    this.props.referActions.setOptions({ treePath: path, pageIndex: 1 });
    this.props.referActions.getFlatGoodsData(false, path, false, '')
  }

  onSearch = (value) => {
    // 丹总说搜索不带树过滤
    // 丹总说取消时候恢复以前的选中叶签和数据,需要备份
    const { tableData, treePath, accordionKey } = this.props.goodsRefer;
    this.props.referActions.setOptions({
      referKeyword: value, pageIndex: 1, treePath: '', accordionKey: '',
      search_copy_treePath: treePath, search_copy_tableData: tableData, search_copy_accordionKey: accordionKey
    });
    this.props.referActions.getFlatGoodsData(false, false, false, value, true) // isSearch为true
  }

  /* 搜索框的onChange */
  searchChange (val) {
    this.props.referActions.setOptions({ referKeyword: val });
  }

  /* 搜索框取消按钮的事件 */
  searchBarCancel () {
    const { search_copy_tableData, search_copy_treePath, search_copy_accordionKey } = this.props.goodsRefer;
    if (!search_copy_tableData && !search_copy_treePath) {
      this.props.referActions.setOptions({ referKeyword: '' })
    } else {
      this.props.referActions.setOptions({
        tableData: search_copy_tableData,
        treePath: search_copy_treePath,
        accordionKey: search_copy_accordionKey,
        referKeyword: '',
        isSearchResult: false,
      })
    }
  }

  /* 选规格按钮click */
  selectSpecs (product) {
    // console.log("获取"+id+"下的skuid")
    this.props.referActions.setOptions({ visible: true })
    this.props.referActions.selectSpec(product.id, product)
  }

  /* sku单选框选择 */
  onRadioChange (freeId, value) {
    const { radioKey } = this.props.goodsRefer;
    radioKey[freeId] = value
    this.props.referActions.setOptions({ radioKey })
  }

  /* 步进器数量改变 */
  stepValueChange (upDown, event, type, value, product, callBack) {
    // let { cartInfo } = this.props.goodsRefer;
    // let { numObj, cartData } = cartInfo;
    if (type === 'spec')
      this.props.referActions.setOptions({ stepValue: value })
    if (type === 'sku') {
      this.props.referActions.skuAddToCart(value, product);
      if (!event || upDown === 'down') return
      // 小球动画
      var top = event.clientY; // 小球降落起点
      var left = event.clientX;
      var endTop = window.innerHeight - 30; // 小球降落终点
      var endLeft = 25;

      // 小球到达起点
      var ballArr = this.points.children;
      var outer = null;
      for (let i = 0; i < ballArr.length; i++) {
        if (ballArr[i].style.display === 'none') {
          outer = ballArr[i];
          break;
        }
      }
      // var outer = this.points.children[0];
      outer.style.display = 'block';
      outer.style.left = left + 'px';
      outer.style.top = top + 'px';
      // var inner = outer.find(".point-inner");
      var inner = outer.children[0]

      setTimeout(function () {
        // 将jquery对象转换为DOM对象
        outer.style.webkitTransform = 'translate3d(0,' + (endTop - top) + 'px,0)';
        inner.style.webkitTransform = 'translate3d(' + (endLeft - left) + 'px,0,0)';

        // 小球运动完毕恢复到原点
        setTimeout(function () {
          outer.removeAttribute('style')
          outer.style.display = 'none'
          inner.removeAttribute('style')
        }, 1000); // 这里的延迟值和小球的运动时间相关
      }, 1);
    }
  }

  /* 选择规格弹出层取消 */
  onSpecCancelClick () {
    this.props.referActions.setOptions({ visible: false, radioKey: {}, stepValue: 1 })
  }

  /* 选择规格弹出层确定 */
  onSpecOkClick () {
    const { radioKey } = this.props.goodsRefer;
    if (JSON.stringify(radioKey).length <= 2) {
      cb.utils.alert('未选中任何规格！', 'error')
      return
    }
    this.props.referActions.specOkBtnClick();
  }

  /* 购物车modal弹出 */
  showCartClick (e) {
    e.preventDefault(); // 修复 Android 上点击穿透
    const { cartInfo } = this.props.goodsRefer;
    cartInfo.cartVisible = !cartInfo.cartVisible;
    this.props.referActions.setOptions({ cartInfo })
  }

  /* 购物车modal关闭 */
  cartClose = () => {
    const { cartInfo } = this.props.goodsRefer;
    cartInfo.cartVisible = false
    this.props.referActions.setOptions({ cartInfo })
    // this.props.referActions.changeObjInfo({key: ['cartInfo', 'cartVisible'], value: {cartVisible: false}})
  }

  /* 删除购物车商品行 */
  cartRowDelete (ele, isAllDelete) {
    const { cartInfo } = this.props.goodsRefer;
    if (!ele && isAllDelete) {
      cartInfo.cartData = [];
      cartInfo.numObj = {};
      cartInfo.cartVisible = false;
      this.props.referActions.setOptions({ cartInfo })
      return
    }
    const index = cartInfo.cartData.findIndex(product => {
      return product.exactKey == ele.exactKey
    })
    if (index !== -1) {
      delete cartInfo.numObj[cartInfo.cartData[index].exactKey]
      cartInfo.cartData.splice(index, 1)
      if (cartInfo.cartData.length == 0)
        cartInfo.cartVisible = false
      this.props.referActions.setOptions({ cartInfo })
    }
  }

  /* 商品参照最后确定 */
  finallyOkClick () {
    const { referActions, dispatch, salesClerk } = this.props;
    // const { billingStatus } = this.props.uretailHeader;
    /// /以下是在将商品添加到购物时，判断是否有营业，如没有则跳转到营业员界面。
    const salesChecked = salesClerk.salesChecked;
    if (salesChecked && salesChecked != '') {
      referActions.cartToBilling();
      return;
    }

    isbackBillingTouch = true;
    dispatch(push('/billingRefer'));
    // if (billingStatus != 'NoFormerBackBill' && billingStatus != 'FormerBackBill') {
    this.props.editRowAction.showSalesList();
    // }
  }

  /* 启用规格的商品 */
  getWrapSpecContent (ele) {
    const { cartInfo } = this.props.goodsRefer;
    const { numObj } = cartInfo;
    let specBadge = 0;
    for (const attr in numObj) {
      if (attr.startsWith(ele.id))
        specBadge += numObj[attr]
    }
    const str = <div>
      <Badge text={specBadge} overflowCount={99}><Button className='choose-rule' onClick={() => this.selectSpecs(ele)}>选规格</Button></Badge>
    </div>
    return str
  }

  /* sku的商品 */
  getWrapSkuContent (ele) {
    const { cartInfo } = this.props.goodsRefer;
    const { numObj } = cartInfo;
    if (!numObj[ele.exactKey]) {
      return <span className='plus-btn' onClick={(e) => this.stepValueChange('up', e, 'sku', 1, ele, function () { Toast.success('成功添加一件商品', 0.5) })}><i className='icon icon-jia' /></span>
    } else {
      return <StepperSelf
        showNumber
        min={0}
        onChange={(value, e, upDown) => this.stepValueChange(upDown, e, 'sku', value, ele)}
        value={numObj[ele.exactKey]}
      />
    }
  }

  /* 商品list */
  getContent (tableData) {
    // let tableData = this.props.goodsRefer.tableData || [];
    const { isSearchResult } = this.props.goodsRefer;
    let arr = [];
    if (tableData.length == 0) {
      arr = [<div className={isSearchResult ? 'refer_search_no_data' : 'refer_no_data'} />]
      return arr
    }
    tableData.forEach(ele => {
      const isBtn = this.isHaveSpecBtn(ele)
      arr.push(
        <div className='list clearfix'>
          <div className='refer_product_img'>
            {ele.productAlbums ? <img src={ele.productAlbums[0].murl} alt='图片' /> : <Icon type='icon-morentupiancopy' />}
          </div>
          <div className='refer_product_right'>
            <div className='name'>{ele.cName}</div>
            <div className='price'>
              <i className='smlProImg_f' />
              <span className='jiage'><i>￥</i>{getFixedNumber(ele.salePrice, 'monovalentdecimal')}</span>
              {isBtn
                ? this.getWrapSpecContent(ele)
                : this.getWrapSkuContent(ele)}
            </div>
          </div>
        </div>
      )
    })
    return arr
  }

  getTree () {
    const { treeData, treePath, accordionKey } = this.props.goodsRefer
    if (!treeData) return null
    const treeArr = []
    treeData.forEach(tree => {
      const childrenArr = []
      if (tree.children) {
        tree.children.forEach(children => {
          // listItem里的onClick中传入children.id
          childrenArr.push(<List.Item className={treePath == children.id ? 'refer_tree_selected' : ''} onClick={() => this.listOnclick(children.id)}>{children.name}</List.Item>)
        })
      }
      const childrenContent = childrenArr.length > 0 ? <List>{childrenArr}</List> : null
      treeArr.push(<Accordion.Panel header={tree.name} key={tree.id}>{childrenContent}</Accordion.Panel>)
    })
    return (
      // 一级菜单的点击，出入onChange来控制
      <Accordion activeKey={accordionKey} onChange={(key) => this.accordionChange(key)} accordion openAnimation={{}}>{treeArr}</Accordion>
    )
  }

  getTable (height) {
    const tableData = this.props.goodsRefer.tableData || [];
    const content = this.getContent(tableData);
    const { refreshing, isGetNextData } = this.props.goodsRefer
    const styleHeight = height ? (height - (2.48 * window.__fontUnit)) : 0;
    const finishText = isGetNextData ? '上拉加载更多' : '没有商品了哦'
    const deactivateText = tableData.length < 8 ? ' ' : '上拉加载更多';
    return (<div>
      {/* <Button
        style={{ marginBottom: 15 }}
        onClick={() => this.setState({ down: !this.state.down })}
      >
        direction: {this.state.down ? 'down' : 'up'}
      </Button> */}
      <PullToRefresh
        ref={el => { this.ptr = el }}
        style={{
          overflow: 'auto',
          height: styleHeight
        }}
        indicator={{ finish: finishText, deactivate: deactivateText }}
        direction='up'
        refreshing={refreshing}
        onRefresh={this.startRefresh}
        className='up_pull_reFresh'
      >
        {/* {this.state.data.map(i => (
          <div key={i} style={{ textAlign: 'center', padding: 20 }}>
            {`上拉加载${i}`}
          </div>
        ))} */}
        <div>{content}<ChangeSpecModal where='GoodsRefer' /></div>
      </PullToRefresh>
    </div>);
  }

  getCartContent (cartInfo) {
    const data = (cartInfo && cartInfo.cartData) || []
    const content = []; let totalNum = 0; let money = 0;
    data.forEach(ele => {
      const rowMoney = (ele.skuSalePrice || ele.salePrice) * ele.fQuantity;
      const row = <div className='list'>
        <span className='icon-del' onClick={() => this.cartRowDelete(ele)}>
          <i className='icon icon-shurukuangshanchu' />
        </span>
        <div className='list-title'>
          <div className='line-hei'>
            <span className='name'>{ele.cName}</span>
            <span className='sku'>{ele.specs ? ele.specs : ''}</span>
          </div>
        </div>
        <span className='money'><i>¥</i>{getFixedNumber(rowMoney)}</span>
        <StepperSelf
          showNumber
          min={0}
          onChange={(value) => this.stepValueChange(null, null, 'sku', value, ele)}
          value={ele.fQuantity}
        />
      </div>
      totalNum += ele.fQuantity;
      money += rowMoney
      content.push(row)
    })
    return { content, totalNum, money: getFixedNumber(money) }
  }

  /* 购物车功能 */
  getCart () {
    const { cartInfo } = this.props.goodsRefer;
    const cartVisible = cartInfo.cartVisible;
    const { content, totalNum, money } = this.getCartContent(cartInfo);
    if (totalNum <= 0) {
      return (
        <div className='cart_row cart_row_full'>
          <div className='cart'><Badge text={totalNum} overflowCount={99}><Button disabled={!(totalNum > 0)} onClick={(e) => this.showCartClick(e)}>
            <i className='icon icon-xuanzeshangping' />
          </Button></Badge></div>
          <div className='full_cart'>购物车空空如也</div>
        </div>
      )
    }
    const str = <div className='cart_row'>
      <div className='cart'><Badge text={totalNum} overflowCount={99}><Button disabled={!(totalNum > 0)} onClick={(e) => this.showCartClick(e)}>
        <i className='icon icon-xuanzeshangping' />
      </Button></Badge></div>
      <Modal className='choose-list-modal'
        popup
        visible={cartVisible}
        animationType='slide-up'
        transitionName='test_slide_up'
        maskClosable={true}
        onClose={(e) => this.showCartClick(e)}
      // footer={[{ text: '返回购物车', onPress: () => { console.log('ok'); this.cartClose() } }]}
      >
        <div className='choose-list-content'>
          <div className='title'>
            <span>数量 </span><span>{totalNum}件</span>
            <span onClick={() =>
              Modal.alert(<div className='icon_wenhao' />, '确定要清空已选商品吗？', [
                { text: '取消', onPress: () => console.log('cancel') },
                { text: '确定', onPress: () => this.cartRowDelete(null, true) },
              ])
            }><Icon type='icon-delete' className='icon-delete' /> 清空全部</span>
          </div>
          <div className='scroll'>{content}</div>
        </div>
      </Modal>
      <div className='count'><span>总计</span><span><i>¥</i>{money}</span></div>
      <div className='hoice-btn'>
        <Button onClick={() => this.finallyOkClick()}>选好了</Button>
      </div>
    </div>
    return str
  }

  render () {
    const height = this.didmount ? window.screen.height : this.state.height;
    const treeDom = this.getTree();
    const tableDom = this.getTable(height);
    const cartDom = this.getCart();
    const cartVisible = this.props.goodsRefer.cartInfo.cartVisible;
    const { referKeyword } = this.props.goodsRefer;
    return (
      <div style={{ height: height + 'px' }} className='goodsRefer-height'>
        <div>
          <div className='refer_nav'>
            <span onClick={this.backClick}><i className='icon icon-fanhui' /></span>
            <SearchBar
              placeholder='商品名称'
              onSubmit={this.onSearch}
              value={referKeyword}
              onChange={val => this.searchChange(val)}
              onCancel={() => this.searchBarCancel()}
              ref={ref => { this.manualFocusInst = ref }} />
          </div>
          <div className='refer_content clearfix'>
            <div className='left-content'>{treeDom}</div>
            <div className='right-content'>{tableDom}</div>
          </div>
          <div className='cart_content'><div className={cartVisible ? 'bg no-bg' : 'bg'}><div /></div>{cartDom}</div>
        </div>
        <div className='ball_collection' ref={node => { this.points = node }}>
          <div className='pointOuter' style={{ display: 'none' }}>
            <div className='point-inner' />
          </div>
          <div className='pointOuter' style={{ display: 'none' }}>
            <div className='point-inner' />
          </div>
          <div className='pointOuter' style={{ display: 'none' }}>
            <div className='point-inner' />
          </div>
          <div className='pointOuter' style={{ display: 'none' }}>
            <div className='point-inner' />
          </div>
          <div className='pointOuter' style={{ display: 'none' }}>
            <div className='point-inner' />
          </div>
          <div className='pointOuter' style={{ display: 'none' }}>
            <div className='point-inner' />
          </div>
          <div className='pointOuter' style={{ display: 'none' }}>
            <div className='point-inner' />
          </div>
          <div className='pointOuter' style={{ display: 'none' }}>
            <div className='point-inner' />
          </div>
          <div className='pointOuter' style={{ display: 'none' }}>
            <div className='point-inner' />
          </div>
          <div className='pointOuter' style={{ display: 'none' }}>
            <div className='point-inner' />
          </div>
        </div>
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    billing: state.billing.toJS(),
    goodsRefer: state.goodsRefer.toJS(),
    product: state.product.toJS(),
    uretailHeader: state.uretailHeader.toJS(),
    salesClerk: state.salesClerk.toJS()
  };
}

function mapDispatchToProps (dispatch) {
  return {
    referActions: bindActionCreators(referActions, dispatch),
    addProduct: bindActionCreators(addProduct, dispatch),
    modifyQuantity: bindActionCreators(modifyQuantity, dispatch),
    setFocusedRow: bindActionCreators(setFocusedRow, dispatch),
    editRowAction: bindActionCreators(editRowAction, dispatch),
    dispatch,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(GoodsRefer)
