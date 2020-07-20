import React, { Component } from 'react';
import { Select } from 'antd';
// import text from '@mdf/metaui-web/lib/components/basic/text';
const Option = Select.Option;
export default class purchaseCycle extends Component {
  constructor (props) {
    super(props);
    this.state = {
      values: {
        1: '按日配送',
        2: '每周一次',
        3: '每月一次'
      }
    }
  }

  render () {
    let _values = this.props.values;
    const {mode} = this.props
    if(!_values || _values.length > 1 ) _values = '1';
    if(mode == 'browse') {
      return <span>{this.state.values[_values]}</span>
    }
    return (
      <Select defaultValue={_values} onChange={this.props.handleChange}>
        <Option value='1'>按日配送</Option>
        <Option value='2'>每周一次</Option>
        <Option value='3'>每月一次</Option>
      </Select>
    );
  }
}
