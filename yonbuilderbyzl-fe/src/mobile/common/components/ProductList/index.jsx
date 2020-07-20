import React, { Component } from 'react'
import { Icon } from '@mdf/baseui-mobile';
import './style.css'
import { getFixedNumber } from 'src/common/redux/modules/billing/paymode'
class ProductList extends Component {
  constructor (props) {
    super(props);
    this.state = { hgtNum: 1 };
  }

  componentWillMount () {
    const { data } = this.props;
    if (cb.utils.isEmpty(data)) {
      return;
    }
    if (data.length > 3) {
      this.setState({ hgtNum: 3 });
    } else {
      this.setState({ hgtNum: data.length });
    }
  }

  renderList () {
    const { data } = this.props;
    const arrView = [];
    if (cb.utils.isEmpty(data)) {
      return arrView;
    }
    let specs = '';
    data.map((item, i) => {
      specs = '';
      for(const attr in item) { if(attr.startsWith('free')) { specs += item[attr] + ' ' } }
      arrView.push(
        <div key={item.id} className='pro_contains_item_v' style={{ height: '2.1rem' }}>
          {(item.productAlbums && item.productAlbums.length > 0) ? <img src={item.productAlbums[0].murl} alt='图片' /> : (item.product_Img_imgName ? <img src={'http://7xr7bp.com1.z0.glb.clouddn.com' + item.product_Img_folder + item.product_Img_imgName} alt='图片' /> : <Icon type='icon-morentupiancopy' />)}
          <div className='pro_item_v'>
            <span>{item.product_cName}</span>
            {
              cb.utils.isEmpty(specs) ? '' : (
                <span>规格:{specs}</span>
              )
            }

            <span className='money'>
              <div>
                <i><em>￥</em>{getFixedNumber(item.fMoney)}</i>
                <i style={{ display: (parseFloat(item.fMoney) === parseFloat(item.fQuoteMoney)) ? 'none' : 'block' }}><em>￥</em>{getFixedNumber(item.fQuoteMoney)}</i>
              </div>
              <span className='iEmployeeid_name'><i>营</i>{item.iEmployeeid_name}</span></span>
            <span className='billing-product-num'><em>X</em>{item.fQuantity} </span>
          </div>

        </div>
      )
    })

    return arrView;
  }

  render () {
    const hgtNum = parseInt(this.state.hgtNum);
    const viewContents = this.renderList();
    return (
      <div>
        <div className='' style={{ height: (hgtNum * 2.2) + 'rem', overflow: 'hidden' }}>
          {viewContents}
        </div>
        <div className='more' style={{ display: (viewContents.length > 3 ? 'block' : 'none') }} onClick={() => { this.setState({ hgtNum: (hgtNum === viewContents.length ? 3 : viewContents.length) }) }}>
          <p>{hgtNum === viewContents.length ? (
            <span>收起<i className='icon icon-shouqi' /></span>
          ) : (
            <span>展开剩余{viewContents.length - 3}件商品<i className='icon icon-zhakai' /></span>
          )} </p>
        </div>
      </div>
    )
  }
}

export default ProductList;
