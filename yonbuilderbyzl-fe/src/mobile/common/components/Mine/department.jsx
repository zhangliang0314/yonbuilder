import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux'
import { goBack } from 'react-router-redux';
import _ from 'lodash'
import Immutable from 'immutable'
import * as mineActions from 'src/common/actions/mine'
import { Checkbox, List, Button, ListView, SearchBar } from '@mdf/baseui-mobile';
import './style.css'
// import styles from './style.css'
// const { Item } = List;

class Department extends Component {
  constructor (props) {
    super(props);
    const getSectionData = (dataBlob, sectionID) => dataBlob[sectionID];
    const getRowData = (dataBlob, sectionID, rowID) => dataBlob[rowID];

    const dataSource = new ListView.DataSource({
      getRowData,
      getSectionHeaderData: getSectionData,
      rowHasChanged: (row1, row2) => row1 !== row2,
      sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
    });

    this.state = {
      inputValue: '',
      dataSource,
      departmentId: this.props.mine.user.department,
      departmentName: this.props.mine.user.department_name,
      isLoading: true,
      children: [],
      cacheDept: [],
      currentLevel: 0,
      searchDept: [],
      /* add by jinzh1 */
      keyField: 'id',
      selectedKey: this.props.mine.user.department || null,
      expandKeys: [],
      selectNode: null,
    };
  }

  componentDidMount () { }

  onSearch = (val) => {
    const { mine } = this.props;
    const datas = mine.departments;
    const searchDept = [];
    // datas.map((dept)=>{
    //     if(dept.name.indexOf(val)>=0){
    //         searchDept.push(dept);
    //     }
    // });

    this.searchDept(datas, searchDept, val);
    console.log(searchDept.length);
    this.setState({ searchDept: searchDept, inputValue: val, children: searchDept });
  }

  searchDept (datas, searchDept, val) {
    datas.map(function (dept) {
      if (dept.name.indexOf(val) >= 0) {
        searchDept.push(dept);
      }
      if (!dept.isEnd) {
        this.searchDept(dept.children, searchDept, val);
      }
    }.bind(this));
  }

  handSelectItem (rowData) {
    if (!rowData.isEnd) {
      this.setState({ children: rowData.children });
    } else {
      this.setState({ departmentId: rowData.id, departmentName: rowData.name }, function () {
        this.chooseEnd();
      }.bind(this));
    }
    const temDept = this.getDept(rowData.level);
    if (temDept === null) {
      const cacheDept = this.state.cacheDept;
      cacheDept.push({ level: rowData.level, dept: rowData });
      this.setState({ cacheDept: cacheDept });
    }
    this.setState({ currentLevel: rowData.level });
  }

  chooseEnd () {
    // if (cb.utils.isEmpty(this.state.departmentId)) {
    //   cb.utils.Toast('未选择部门', 'fail');
    //   // Toast.fail('未选择部门',1);
    //   return;
    // }
    let { mineAction, mine, dispatch } = this.props;
    const selectNode = this.state.selectNode;
    mine = Immutable.fromJS(mine);
    mineAction.modifyMineInfo(mine.get('user').set('department', selectNode.id)
      .set('department_code', selectNode.code).set('department_name', selectNode.name)
    );
    dispatch(goBack());
  }

  renderList () {
    const { mine } = this.props;
    let datas = mine.departments;
    if (this.state.children && this.state.children.length > 0) {
      datas = this.state.children;
    }
    // return this.listItem(datas);
    return this.loopTreeNodes(datas);
  }

  onCheckedChange = (e, node) => {
    const { keyField } = this.state;
    this.setState({ selectedKey: node[keyField], selectNode: node });
  }

  onListItemClick = (e, node) => {
    if (e.target.type == 'checkbox') return;
    const { keyField, expandKeys } = this.state;
    let keys = [];
    if (_.indexOf(expandKeys, node[keyField]) == -1) {
      expandKeys.push(node[keyField]);
      keys = expandKeys;
    } else {
      expandKeys.map(key => {
        if (key != node[keyField]) keys.push(key);
      });
    }
    this.setState({ expandKeys: keys });
  }

  loopTreeNodes (nodes) {
    if (!nodes || nodes.length == 0) return null;
    const { keyField, selectedKey, expandKeys } = this.state;
    let controls = [];
    nodes.map(node => {
      let checked, expanded
      if (selectedKey == node[keyField]) checked = true;
      if (_.indexOf(expandKeys, node[keyField]) != -1) expanded = true;
      const level = node.level;

      if (node.children) {
        controls.push(
          <List.Item className={'refer-row-level' + level} key={node.name} onClick={e => this.onListItemClick(e, node)} arrow={expanded ? 'up' : 'down'}
            thumb={<Checkbox checked={checked} onChange={e => this.onCheckedChange(e, node)} />}>
            {node.name}
          </List.Item>
        );
        if (expanded) {
          const newControl = this.loopTreeNodes(node.children);
          controls = controls.concat(newControl);
        }
      } else {
        controls.push(
          <List.Item className={'refer-row-level' + level} key={node.name} thumb={<Checkbox checked={checked}
            onChange={e => this.onCheckedChange(e, node)} />}>
            {node.name}
          </List.Item>
        )
      }
    });
    return controls;
  }
  // listItem(departments) {
  //   let views = [];
  //   if (!departments) {
  //     return views;
  //   }
  //   departments.map((rowData) => {
  //     views.push(<div key={rowData.id} className="my-class-name-list">
  //       <Item onClick={this.handSelectItem.bind(this, rowData)} arrow={rowData.isEnd ? 'empty' : 'horizontal'} key={rowData.id}>{rowData.name}<span className="my-class-list-select">{(rowData.id === this.state.departmentId) ? <Icon type="icon-xuanzhong1" size='sm' /> : ''}</span></Item>
  //     </div>);
  //   });
  //   return views;
  // }

  getDept (currentLevel) {
    const { cacheDept } = this.state;
    let temDept = null;
    cacheDept.map((dept) => {
      if (dept.level === currentLevel) {
        temDept = dept.dept;
      }
    });
    return temDept;
  }

  goBack () {
    const { dispatch } = this.props;
    let { currentLevel, searchDept } = this.state;
    if (currentLevel > 0) {
      currentLevel = currentLevel - 1;
      const temDept = this.getDept(currentLevel);
      if (temDept === null) {
        if (searchDept && searchDept.length > 0) {
          this.setState({ currentLevel: currentLevel, children: searchDept });
        } else {
          this.setState({ currentLevel: currentLevel, children: [] });
        }
      } else {
        this.setState({ currentLevel: temDept.level, children: temDept.children });
      }
    } else {
      dispatch(goBack());
    }
  }

  onCancel () {
    this.setState({ searchDept: [], inputValue: '', children: [] });
  }

  render () {
    // let { dispatch } = this.props;
    return (<div className='department-count'>
      <div className='department-top' style={{ position: 'fixed', zIndex: 999, top: 0, left: 0, right: 0, display: 'flex', }}>
        <span className='department-fanhui-block'><i onClick={this.goBack.bind(this)} className='icon icon-fanhui' /></span>
        <SearchBar
          style={{ flex: '1' }}
          value={this.state.inputValue}
          placeholder='搜索'
          onChange={this.onSearch}
          onClear={this.onCancel.bind(this)}
          onCancel={this.onCancel.bind(this)}
        />
      </div>
      <div className='my-class-name-count'>
        {this.renderList()}
      </div>
      <div className='button-fixed-bottom'>
        <Button style={{ color: '#000' }} onClick={() => { this.chooseEnd() }} type='warning'>确定</Button>
      </div>
    </div>);
  }
}

function mapStateToProps (state) {
  return {
    mine: state.mine.toJS()
  }
}

function mapDispatchToProps (dispatch) {
  return {
    mineAction: bindActionCreators(mineActions, dispatch),
    dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Department)
