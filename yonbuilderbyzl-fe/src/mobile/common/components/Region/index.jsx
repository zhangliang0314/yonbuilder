import React, { Component } from 'react';
import {connect} from 'react-redux';
import { bindActionCreators } from 'redux';
import * as reserveActions from 'src/common/redux/modules/billing/reserve';
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar'
import { SearchBar } from '@mdf/baseui-mobile'

class Region extends Component {
  constructor (props) {
    super(props);
    this.state = {townStatus: false, districtStatus: false, city: null, town: null, district: null};
  }

  componentWillMount () {
    this.props.reserveActions.getRegion();
  }

  onSearch () {

  }

  onChange () {

  }

  onCancel () {

  }

  cityControll () {
    const controlls = [];
    const { Region_DataSource } = this.props.reserve;
    if(!Region_DataSource) {
      return null;
    }
    Region_DataSource[0].children.map((obj) => {
      controlls.push(<div onClick={() => { this.setState({city: obj}); }} key={obj.id}>{obj.name + '   ' + obj.id}</div>);
    });
    return controlls;
  }

  townControll () {
    // let controlls = [];
    this.state.city.children.map(() => {
      // controlls
    });
  }

  getRegion (obj) {
    console.log(obj.id + '    ' + obj.name);
    if(obj.children && obj.children.length > 0) {
      obj.children.map((objchild) => {
        this.getArea(objchild);
      });
    }
  }

  render () {
    const { townStatus, districtStatus } = this.state;
    return (
      <div>
        <NavBar title='选择地区' />
        <SearchBar placeholder='搜索' onSubmit={this.onSearch.bind(this)} onChange={this.onChange.bind(this, 'search')} onClear={this.onCancel.bind(this, 'clear')} onCancel={this.onCancel.bind(this, 'cancel')} />
        <div style={{display: 'flex', width: '100%', height: '100%'}}>
          <div style={{flex: '1', display: 'flex', flexFlow: 'column', overflowY: 'scroll'}}>
            {
              this.cityControll()
            }
          </div>
          <div style={{flex: '1', display: (townStatus ? 'flex' : 'none')}}>
            {

            }
          </div>
          <div style={{flex: '1', display: (districtStatus ? 'flex' : 'none')}}>3</div>
        </div>
      </div>
    )
  }
}

function mapStateToProps (state) {
  return {
    reserve: state.reserve.toJS(),
  };
}

function mapDispatchToProps (dispatch) {
  return {
    reserveActions: bindActionCreators(reserveActions, dispatch),
    dispatch,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Region)
