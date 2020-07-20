import React, { Component } from 'react';
import { Modal, Icon, Radio, Stepper, List, Button } from 'antd-mobile';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { setOptions, specOkBtnClick, skuAddToCart, getKeyMap } from '../reducers/modules/goodsRefer'
import { getFixedNumber } from 'src/common/redux/modules/billing/paymode'

class ChangeSpecModal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      dataSource: props.dataSource || {},
      where: props.where || 'GoodsRefer',
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.where && nextProps.where != this.state.where) {
      this.setState({ where: nextProps.where })
    }
  }

  /* sku单选框选择 */
  onRadioChange (product, value, specStringArr, entryPoint, original_specStringArr) {
    let { radioKey, checkedSpec, currentProduct } = this.props.goodsRefer;
    const newSpecStringArr = this.getShowSpecArr(product.freeId, value, original_specStringArr, specStringArr, checkedSpec, currentProduct.product);
    if (!checkedSpec || checkedSpec.length == 0) {
      checkedSpec = [];
      checkedSpec.push(product.freeId);
    }
    radioKey[product.freeId] = value;
    const length = Object.keys(radioKey).length;
    this.props.setOptions({ radioKey, specStringArr: newSpecStringArr, checkedSpec })
    if (specStringArr.length == length) {
      this.props.specOkBtnClick(entryPoint, product, true);
    }
  }

  /* add by jinzh1  根据所选sku过滤其它sku显示项 */
  getShowSpecArr = (freeId, value, original_specStringArr, specStringArr, checkedSpec, productId) => {
    const newArr = [];
    const skuKeyMap = getKeyMap();
    const key = productId + '&&' + freeId + '&&' + value;
    const skuObj = skuKeyMap[key];
    let specArr = original_specStringArr;
    if (!checkedSpec || checkedSpec.length == 0) specArr = specStringArr;
    specArr.map(spec => {
      if (spec.freeId != freeId) {
        const newSpec = cb.utils.extend(true, {}, spec);
        newSpec.specificationItem = skuObj[newSpec.freeId];
        newArr.push(newSpec);
      } else {
        newArr.push(spec);
      }
    });
    return newArr;
  }

  /* 步进器数量改变 */
  stepValueChange (type, value, product, callBack) {
    // let { cartInfo } = this.props.goodsRefer;
    // let { numObj, cartData } = cartInfo;
    if (type === 'spec')
      this.props.setOptions({ stepValue: value })
    if (type === 'sku') {
      this.props.skuAddToCart(value, product);
    }
  }

  /* 选择规格弹出层取消 */
  onSpecCancelClick (e) {
    e.preventDefault(); // 修复 Android 上点击穿透
    this.props.setOptions({ visible: false, radioKey: {}, stepValue: 1, stashSku: {}, checkedSpec: null })
  }

  /* 选择规格弹出层确定 */
  onSpecOkClick (entryPoint, product) {
    const { radioKey, specStringArr } = this.props.goodsRefer;
    const radioKeyLength = Object.keys(radioKey).length;
    if (radioKeyLength != specStringArr.length) {
      // cb.utils.alert("未选中任何规格！", 'error')
      cb.utils.Toast('请选择规格属性 !', 'error');
      return
    }
    this.props.specOkBtnClick(entryPoint, product);
  }

  overlayContent (ele = {}) {
    const { specStringArr, original_specStringArr, radioKey, stepValue, stashSku = {} } = this.props.goodsRefer;
    const where = this.state.where;
    // let _name = where==='GoodsRefer' ? ele.cName : ele.product_cName;
    // let _price = where==='GoodsRefer' ? (stashSku.skuSalePrice || ele.salePrice) : ele.fPrice;
    const _name = ele.cName || ele.product_cName;
    const initPrice = (ele.fPrice != undefined) ? ele.fPrice : ele.salePrice;
    const _price = stashSku.skuSalePrice || initPrice;
    const arr = [];
    specStringArr && specStringArr.forEach(ele => {
      const rowChildren = ele.specificationItem.map(specV => {
        return <Radio.RadioItem key={specV} checked={radioKey[ele.freeId] === specV} onChange={(e) => this.onRadioChange(ele, specV, specStringArr, where, original_specStringArr)}>
          <span className={radioKey[ele.freeId] === specV ? 'sepc_active_red' : ''}>{specV}</span>
        </Radio.RadioItem>
      })
      const row = <div className='choose-sku'>
        <div className='refer_specItem_name'>{ele.specificationName}</div>
        <List className='clearfix'>{rowChildren}</List>
      </div>
      arr.push(row)
    })
    const str = <div className='choose-rule' style={{ position: 'absolute', height: '100%' }}>
      <div className='list clearfix'>
        <div className='refer_product_img'>
          {ele.productAlbums ? <img src={ele.productAlbums[0].murl} alt='图片' /> : <Icon type='icon-morentupiancopy' />}
        </div>
        <div className='refer_product_right'>
          <div className='name'>{_name}</div>
          <div className='price'>
            <span><i>￥</i>{getFixedNumber(_price, 'monovalentdecimal')}</span>
          </div>
        </div>
      </div>
      <div className='sku-scroll'>{arr}</div>
      {where === 'GoodsRefer' ? <div className='choose-rule-number'>
        <span className='count'>数量</span>
        <Stepper
          showNumber
          min={1}
          onChange={(value) => this.stepValueChange('spec', value)}
          value={stepValue}
        />
      </div> : null}
      {where === 'GoodsRefer' ? <div className='button-fixed-bottom' style={{ position: 'absolute', bottom: '0.4rem' }}><Button type='primary' onClick={() => this.onSpecOkClick()}>加入购物车</Button></div> : <div className='button-fixed-bottom'><Button type='primary' onClick={() => this.onSpecOkClick('billing', ele)}>确认</Button></div>}
    </div>
    return str
  }

  render () {
    const { visible, currentProduct } = this.props.goodsRefer;
    // let { numObj } = cartInfo;
    const overlayContent = this.overlayContent(currentProduct || this.props.dataSource);
    return (
      <Modal
        popup
        animationType='slide-up'
        visible={visible}
        transparent
        maskClosable={true}
        onClose={(e) => this.onSpecCancelClick(e)}
        closable={true}
        wrapClassName='wrap-choose-rule'
        className='choose-rule'
      >
        {overlayContent}
      </Modal>
    )
  }
}

function mapStateToProps (state) {
  return {
    goodsRefer: state.goodsRefer.toJS(),
    product: state.product.toJS(),
  };
}

function mapDispatchToProps (dispatch) {
  return {
    setOptions: bindActionCreators(setOptions, dispatch),
    specOkBtnClick: bindActionCreators(specOkBtnClick, dispatch),
    skuAddToCart: bindActionCreators(skuAddToCart, dispatch),
    dispatch,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ChangeSpecModal)
