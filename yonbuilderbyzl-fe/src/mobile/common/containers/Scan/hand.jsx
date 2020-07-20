import React, { Component } from 'react';
import { Button, InputItem, WhiteSpace, WingBlank} from 'antd-mobile';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { goBack, replace } from 'react-router-redux'
// import ReactDOM from 'react-dom'
// import NavBar from '@mdf/metaui-mobile/lib/components/NavBar';
import styles from './style.css'
import PropTypes from 'prop-types'
import * as barCodeActions from 'src/common/actions/barCode'
import {saveCode, goodsNum} from './utils'
import * as referActions from '../../reducers/modules/goodsRefer'

class InputCode extends Component {
  constructor (props) {
    super(props)
    this.state = {
      barCode: ''
    }
  }

  static contextTypes = {
    router: PropTypes.object.isRequired
  }

  scanBarView () {
    this.props.dispatch(replace('/scanCode'));
  }

  back () {
    this.props.dispatch(goBack());
  }

  saveCode () {
    saveCode(this, () => {
      console.log('添加商品码---');
    });
  }

  changeInput (value) {
    this.setState({barCode: value});
  }

  changeNum (type) {
    if(type === 'add') {
      console.log(type + '1');
    }else{
      console.log(type + '2');
    }
  }

  render () {
    // let originDpr=1;
    // let h = document.documentElement.clientHeight-185*originDpr;
    return (
      <div className={styles.barcode_view}>
        <div style={{height: 50 + 'px', color: '#fff', lineHeight: '50px'}}>
          <span onClick={() => { this.back() }} className={styles.tab_left_span}>返回</span>
          <span onClick={() => { this.scanBarView() }} className={styles.tab_right_span}>切换扫描</span>
        </div>
        <div>
          <WhiteSpace size='lg' />
          <WingBlank size='lg'>
            {/* <div className={styles.co_style_v}> */}
            <InputItem onChange={this.changeInput.bind(this)} clear placeholder='请输入商品条形码' value={this.state.barCode} />
            {/* <span onClick={()=>{this.changeNum('add')}}>+</span> */}
            {/* <div style={{flex:1,margin:'0 10px'}}>
                <InputItem onChange={this.changeInput.bind(this)} clear placeholder={'请输入商品条形码'} value={this.state.barCode}></InputItem>
             </div> */}
            {/* <span onClick={()=>{this.changeNum('sub')}}>-</span> */}
            {/* </div> */}
            <WhiteSpace size='lg' />
            <div><Button onClick={() => { this.saveCode() }} type='warning'>确定</Button></div>
          </WingBlank>
          <WhiteSpace size='lg' />
          <div className={styles.car_view}>
            <div className={styles.car_radius_v}>
              {goodsNum(this)}
            </div>
          </div>
          <WhiteSpace size='lg' />
          <div style={{color: '#fff', textAlign: 'center'}}>选好了？ </div>
        </div>
      </div>
    )
  }

  // findCodeObj(code){
  //   let { barCodes } = this.props;
  //   let temItem = null;
  //   barCodes.get('codes').find((item)=>{
  //       if(item.code===code){
  //         temItem = item;
  //       }
  //   });
  //   return temItem;
  // }
}

function mapStateToProps (state) {
  return {
    goodsRefer: state.goodsRefer,
    barCodes: state.barCode
  };
}

function mapDispatchToProps (dispatch) {
  return {
    referActions: bindActionCreators(referActions, dispatch),
    barCodeActions: bindActionCreators(barCodeActions, dispatch),
    dispatch,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(InputCode)
