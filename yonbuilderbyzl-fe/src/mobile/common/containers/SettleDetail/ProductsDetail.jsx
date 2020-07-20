import React, {Component} from 'react';
import {Icon} from 'antd-mobile';
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar'
import {connect} from 'react-redux';
import ProductList from 'src/common/containers/ProductList'
import _ from 'lodash'
import {getFixedNumber} from 'src/common/redux/modules/billing/paymode'

export function ProductsDisplay (props) {
  return <div onClick={props.onClick}>
    <h3>
      {_.map(props.products, product => {
        return <div key={product.key} className='settle11'>
          <span>
            {product.fQuantity > 1 ? <span>{product.fQuantity}</span> : ''}
            {product.productAlbums && product.productAlbums.length > 0
              ? <img src={product.productAlbums[0].murl} alt='图片' />
              : <Icon type='icon-morentupiancopy' />}
          </span>
          {/* <span>{product.fQuantity}</span> */}

          {/*     <div className="billing_product_right">
          <div className="billing_product_name">
            <span>{product.product_cName}</span>
             <Button onClick={() => this.onEditRow(index)}>改行</Button>
          </div>
          <div className="billing_product_spec">规格：{product.specs}</div>
          <div className="billing_product_money">
            <span className="billing-product-price">¥{product.fPrice}</span>
            <span>数量 X {product.fQuantity}</span>
          </div>
        </div> */}

        </div>
      })}
      <em>共{props.totalQuantity}件<i /></em>
    </h3>
    <h4>
      <span>￥<em>{getFixedNumber(props.total)}</em></span>商品合计
    </h4>
  </div>
}

// router容器
class ProductsDetailList extends Component {
  render () {
    const products = this.props.products.toJS()
    return (
      <div className='settle14 fixed-top'>
        <NavBar title='商品清单' rightContent={<span>共 {_.sumBy(products, o => {
          return Number(o.fQuantity)
        })} 件</span>} />
        <ProductList products={products} />
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    products: state.product.get('products')
  }
}

export const ProductsDetailListContainer = connect(mapStateToProps, null)(ProductsDetailList)
