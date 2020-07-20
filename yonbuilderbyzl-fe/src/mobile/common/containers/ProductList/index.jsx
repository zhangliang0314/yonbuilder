import React, { Component } from 'react';
import { Icon } from 'antd-mobile';
import { getFixedNumber } from 'src/common/redux/modules/billing/paymode'
export default class ProductList extends Component {
  constructor (props) {
    super(props)
    this.state = {
      products: props.products,
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.products != this.state.products) {
      this.setState({ products: nextProps.products })
    }
  }

  getContent () {
    const { products } = this.state
    const arr = products.map(product => {
      const row =
        <div className='am-swipe-content' key={product.key}>
          <div className='billing_product_left'>{product.productAlbums && product.productAlbums.length > 0 ? <img src={product.productAlbums[0].murl} alt='图片' /> : <Icon type='icon-morentupiancopy' />}</div>
          <div className='billing_product_right'>
            <div className='billing_product_name'>
              <span>{product.product_cName}</span>
              {/* <Button onClick={() => this.onEditRow(index)}>改行</Button> */}
            </div>
            {product.specs ? <div className='billing_product_spec'>规格：{product.specs}</div> : null}
            <span className='billing-product-num'><em>X</em> {product.fQuantity}</span>
            <div className='billing_product_money'>
              <span className='billing-product-price'>¥{getFixedNumber(product.fPrice)} <span className='iEmployeeid_name'><i>营</i>{product.iEmployeeid_name}</span></span>

            </div>
          </div>
        </div>
      return row
    })
    return arr
  }

  render () {
    const content = this.getContent();
    return (
      <div className='settle13'>{content}</div>
    )
  }
}
