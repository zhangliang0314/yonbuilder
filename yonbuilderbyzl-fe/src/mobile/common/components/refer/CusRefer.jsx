import React, { Component } from 'react';
import { Icon } from '@mdf/baseui-mobile';
// import SvgIcon from '@mdf/metaui-web/lib/components/common/SvgIcon';
export default class CusRefer extends Component {
  constructor (props) {
    super(props);
  }

  componentDidMount () {}

  close () {
    if(this.props.close) {
      document.getElementsByClassName('fixed_height_cls')[0].style.overflow = 'auto';
      document.getElementsByClassName('fixed_height_cls')[0].style.height = 'auto';
      document.body.style.overflow = 'auto';
      this.props.close();
    }
  }

  ok (item) {
    if(this.props.ok)
      this.props.ok(item);
  }

  itemsBussinessTypes () {
    const {data, id} = this.props;
    if(!data)
      return <div />
    const arr = [];
    data.map((item) => {
      if(!item)
        return;
      if(id && item.value === id) {
        arr.push(<div className='business-type-list'>{item.label}<span><Icon type='icon-xuanzhong1' /></span></div>);
      }else{
        arr.push(<div className='business-type-list' onClick={this.ok.bind(this, item)}>{item.label}</div>);
      }
    });
    return arr;
  }

  render () {
    const { isShow, title } = this.props;
    if(isShow) {
      const clientHeight = window.screen.height;
      document.body.style.overflow = 'hidden';
      document.getElementsByClassName('fixed_height_cls')[0].style.overflow = 'hidden';
      document.getElementsByClassName('fixed_height_cls')[0].style.height = (clientHeight - 2.2 * window.__fontUnit) + 'px';
    }
    return (
      <div style={{backgroundColor: 'rgba(0,0,0,0.4)', width: '100%', height: '100%', position: 'fixed', top: '0', left: '0', zIndex: '10000', display: (isShow ? 'flex' : 'none')}}>
        <div onClick={(e) => { e.preventDefault(); this.close() }} style={{width: '100%', flex: '1'}} />
        <div className='business-type' style={{position: 'fixed', bottom: '0', left: '0', width: '100%', zIndex: '10000', backgroundColor: '#fff'}}>
          <div className='business-type-title'><div className='title'>{title}</div><span className='closed' onClick={() => { this.close() }}><i className='icon icon-guanbi1' /></span></div>
          <div className='business-type-over'> {this.itemsBussinessTypes()}</div>
        </div>
      </div>
    )
  }
}
