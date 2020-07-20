import React, { Component } from 'react'
import { connect } from 'react-redux'
import { SearchBar, List, ListView, PullToRefresh, Drawer, InputItem, Flex, Calendar, Button } from 'antd-mobile'
import { bindActionCreators } from 'redux'
import * as backBill from 'src/common/redux/modules/billing/backBill'
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar';
import _ from 'lodash'
import { dateFormat } from '@mdf/cube/lib/helpers/formatDate';
import './style.css';
import SvgIcon from '@mdf/metaui-web/lib/components/common/SvgIcon';
import BackBillInfo from './BackBillInfo'
import { getFixedNumber } from 'src/common/redux/modules/billing/paymode'
import { genAction } from '@mdf/cube/lib/helpers/util';
// import { goBack } from 'react-router-redux'
require('@mdf/theme-mobile/theme/filter.css');
let totalCount = 0;
// let isLoad = false;
let isSearch = false;
let tempBackBillItem = null;
let isLoadings = false;
class BackBills extends Component {
  constructor (props) {
    super(props);
    this.listViewDataSource = new ListView.DataSource({
      rowHasChanged: (row1, row2) => row1 !== row2,
    });
    this.dataIndex = [];
    this.state = {
      product: '', searchTxt: '', batchNo: '', phone: '', startDate: '', endDate: '', defaultDate: [],
      pIndex: 1, pSize: 10, dataSource: this.listViewDataSource.cloneWithRows(this.dataIndex), data: [],
      tempData: [], isRefreshing: false, isLoading: true, open: false, show: false, deply: {}, isInit: false,
      isBackInfoVisible: false, backBillItem: null, searchStatus: false, isShowRTop: false, totalCount: 0
    }
    // 设置状态栏字体黑色
    cb.utils.setStatusBarStyle('dark');
  }

  componentDidMount () {
    isLoadings = false;
    this.onRefresh();
    // let { CacelModalData, goodsTab_totalCount, goodsTab_currentPage, searchText, phone, startTime, endTime, batchNo } = this.props.backBill;
    /** if (CacelModalData.length > 0) {
      this.setState({ pIndex: goodsTab_currentPage, totalCount: goodsTab_totalCount, searchTxt: searchText, startDate: startTime, endDate: endTime, phone, batchNo }, function () {
        this.calData(CacelModalData, goodsTab_totalCount);
      }.bind(this));
    } else {
      tempBackBillItem = null;
      this.onSearch();
    }**/
    tempBackBillItem = null;
    if (tempBackBillItem) {
      this.setState({ isBackInfoVisible: true, backBillItem: tempBackBillItem });
    }
    window.webViewEventHand.addEvent('BackBillBack', function (callback) {
      this.onBackBillBack(callback);
    }.bind(this));
  }

  componentWillUnmount () {
    this.props.backBillAction.setOptions({ startTime: '', endTime: '' });
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    /** *   const { ModalData,goodsTab_totalCount } = prevProps.state.backBill.toJS();
       let { tempData } = this.state;
       if(isLoad){
           totalCount=ModalData.length;
           let isLoading=false;
           if(goodsTab_totalCount>totalCount){
               isLoading=true;
           }else{
               isLoading=false;
           }
           if(ModalData.constructor===Array){
               isLoad=false;
               tempData = _.unionWith(tempData,ModalData,(obj1,obj2)=>{
                   return obj1.billsCode===obj2.billsCode;
               });
               this.setState({data:ModalData,isLoading,tempData},function(){
                   this.initListData();
               }.bind(this));
           }else{
               this.setState({isLoading});
           }

       }***/
  }

  initListData = () => {
    const { tempData } = this.state;
    if (!tempData || (!tempData.length && tempData.length != 0))
      return;
    tempData.map((item) => {
      const index = _.findIndex(this.dataIndex, (o) => {
        return o.billsCode === item.billsCode;
      })
      if (index < 0) {
        this.dataIndex.push(item);
      }
    });
    this.setState({
      dataSource: this.listViewDataSource.cloneWithRows(this.dataIndex)
    })
  }

  onSearch = () => {
    const { searchTxt, pIndex, pSize, batchNo, phone, isInit } = this.state;
    const { backBillAction } = this.props;
    // isLoad = true;
    backBillAction.backBill(batchNo, phone, searchTxt, pIndex, pSize, isInit, function (ModalData, goodsTab_totalCount) {
      isLoadings = true;
      this.calData(ModalData, goodsTab_totalCount);
    }.bind(this));
  }

  calData (ModalData, goodsTab_totalCount) {
    let { tempData, pIndex } = this.state;
    if (pIndex === 1)
      tempData = [];
    totalCount = ModalData.length;
    let isLoading = false;
    if (goodsTab_totalCount > totalCount) {
      isLoading = true;
    } else {
      isLoading = false;
    }
    if (ModalData.constructor === Array) {
      // isLoad = false;
      tempData = _.unionWith(tempData, ModalData, (obj1, obj2) => {
        return obj1.billsCode === obj2.billsCode;
      });
      tempData = _.sortBy(tempData, (obj) => {
        return -new Date(obj.billsDate).getTime();
      })
      this.setState({ data: ModalData, isLoading, tempData, totalCount: goodsTab_totalCount }, function () {
        this.initListData();
      }.bind(this));
    } else {
      this.setState({ totalCount: goodsTab_totalCount, isLoading });
    }
  }

  renderSeparator = (sectionID, rowID) => (
    <div
      key={rowID}
      style={{
        backgroundColor: '#F5F5F9',
        height: 8,
        borderTop: '1px solid #ECECED',
        borderBottom: '1px solid #ECECED',
      }}
    />
  )

  renderFooter = () => {
    const { tempData, isLoading, totalCount } = this.state;
    let content = '';
    if (isLoading) {
      content = '上拉加载更多';
    } else {
      content = '上拉加载更多';
    }
    if (tempData && tempData.length == 0) {
      content = <div className='list-noData' />
    }
    if (totalCount <= tempData.length) {
      content = '没有更多了~'
    }
    return (
      <div style={{ padding: 15, textAlign: 'center' }}>
        {content}
      </div>
    )
  }

  onRowClick = (item) => {
    const { backBill } = this.props;
    this.setState({ searchStatus: false });
    const retail = _.find(backBill.ModalData, ['key', item.key]);
    if (retail && retail.gatheringVouchDetail) {
      let isSupportBackBill = true; let isSamePay = true;
      if (retail.gatheringVouchDetail.length > 1) {
        let prePayType = 0;
        retail.gatheringVouchDetail.map((gathering) => {
          if (prePayType === 0) {
            prePayType = gathering.iPaytype;
          }
          if (prePayType !== gathering.iPaytype) {
            isSamePay = false;
          }
          if (gathering.iPaytype !== 1 && gathering.iPaytype !== 5) {
            isSupportBackBill = false;
          }
        });
      }
      if (!isSamePay) {
        cb.utils.Toast('不支持移动端退货，请在PC端操作', 'info');
      }
      if (!isSamePay && !isSupportBackBill) {
        cb.utils.Toast('不支持移动端退货，请在PC端操作', 'info');
        return;
      }
    }
    // 设置状态栏字体白色
    cb.utils.setStatusBarStyle('light');
    tempBackBillItem = item;
    this.setState({ isBackInfoVisible: true, backBillItem: item, isShowRTop: false });

    // this.props.dispatch(push({pathname:'/backbillinfo',state:item}))
  }

  onBackBillBack (callback) {
    window.webViewEventHand.cancelEvent(null);
    tempBackBillItem = null;
    this.setState({ isBackInfoVisible: false, backBillItem: null, isShowRTop: true });
    // if(callback)
    //     callback();
  }

  // 隐藏键盘
  /** close_soft_keyboard() {
    if (!window.plus || !window.plus.os) {
      return;
    }

    let closesoftkeyboards = setTimeout(function () {
        plus.key.hideSoftKeybord();
        clearTimeout(closesoftkeyboards);
    }.bind(this), 200);
    return;

    if (plus.os.name == 'iOS') {
      setTimeout(function () {
        var wv_current = plus.webview.currentWebview().nativeInstanceObject();
        wv_current.plusCallMethod({ "setKeyboardDisplayRequiresUserAction": false });
        this.customFocusInst.focus();
      }.bind(this), 200);
    } else {
      // 因为安卓autofocus只有4.0版本以上才支持，所以这里使用native.js来强制弹出
      let focusTime = setTimeout(function () {
        clearTimeout(focusTime);
        this.customFocusInst.focus();
      }.bind(this), 300);
    }
  }**/

  renderList (item, sectionID, rowID) {
    return (<div key={item.key} onClick={() => { this.onRowClick(item) }}>
      <List.Item className='my-list edit-yd-list'>
        <div className='yd-backbill-title'><div className='voucherCode'>{item.billsCode}</div> <div className='value' style={{ display: (item.iBusinesstypeid_name ? 'block' : 'none') }}>{item.iBusinesstypeid_name}</div></div>
        <div className='yd-backbill-money'><span className='name'>实销金额：</span> <span className='value2'>{getFixedNumber(item.totalPrice) < 0 ? '-' : ''}￥{getFixedNumber(item.totalPrice) < 0 ? getFixedNumber(0 - getFixedNumber(item.totalPrice)) : getFixedNumber(item.totalPrice)}({item.totalQuantity}件)</span></div>
        <div className='yd-backbill-date'><span className='name'>单据日期：</span> <span>{item.billsDate}</span></div>
      </List.Item>
    </div>)
  }

  onInputChange = (type, value) => {
    if (type === 'product') {
      this.setState({ batchNo: value });
    } else if (type === 'searchtxt') {
      this.setState({ searchTxt: value });
    }
    /** else if(type==='batchNo' || type==='member'){
        this.setState({phone:value});
    }**/
    else if (type === 'phone' || type === 'member') {
      this.setState({ phone: value });
    }
  }

  onInputBlur = () => {

  }

  onInputFocus = () => {
    this.setState({ show: !this.state.show });
  }

  onCancel = (type) => {
    if (type === 'search') {
      this.setState({ searchStatus: false });
      let isResetData = false;
      const { searchText } = this.props.backBill;
      if (searchText && searchText.length > 0) {
        isResetData = true;
      }
      if (!isResetData) {
        return;
      }
      this.clearDataSource();
      this.props.backBillAction.setOptions({ CacelModalData: [] });
      this.setState({ searchTxt: '', pIndex: 1, tempData: [] }, function () {
        this.onSearch()
      }.bind(this));
    } else {
      this.setState({ show: !this.state.show });
    }
  }

  clearDataSource (reset) {
    this.dataIndex = [];
    totalCount = 0;
    if (!reset) {
      this.props.backBillAction.setOptions({ goodsTab_totalCount: null, ModalData: {} });
    }
  }

  onConfirm (start, end) {
    const tstart = dateFormat(start, 'yyyy-MM-dd');
    const tend = dateFormat(end, 'yyyy-MM-dd');
    this.props.backBillAction.setOptions({ startTime: tstart, endTime: tend, CacelModalData: [] });
    this.setState({ show: false, pIndex: 1, startDate: tstart, endDate: tend, defaultDate: [start, end] });
  }

  onClear = () => {
    this.setState({ startDate: '', endDate: '', defaultDate: [] });
  }

  /* 上拉加载 */
  onEndReached = (event) => {
    const { tempData, totalCount } = this.state;
    if (totalCount > 0 && totalCount <= tempData.length) {
      return;
    }
    this.clearDataSource();
    const { pIndex } = this.state;
    this.setState({ pIndex: (pIndex + 1) });
    this.onSearch();
  }

  /* 下拉刷新 */
  onRefresh = () => {
    this.props.dispatch(genAction('PLATFORM_UI_BILLING_DATASOURCE_REMOVE_CODE'), '');
    this.clearDataSource();
    // let { pIndex } = this.state;
    this.setState({ pIndex: 1 });
    this.onSearch();
  }

  onReset = () => {
    this.clearDataSource(true);
    this.props.backBillAction.setOptions({ goodsTab_totalCount: null, ModalData: {}, startTime: '', endTime: '' });
    this.setState({
      searchTxt: '',
      batchNo: '',
      phone: '',
      startDate: '',
      endDate: '',
      pIndex: 1,
      defaultDate: [],
      data: []
    }, function () {
      this.onSearch();
    }.bind(this));
  }

  onOk = () => {
    isSearch = true;
    this.clearDataSource();
    this.props.backBillAction.setOptions({ CacelModalData: [] });
    this.setState({ open: false, tempData: [], pIndex: 1 }, function () {
      this.onSearch();
    }.bind(this));
  }

  filterView () {
    const { batchNo, phone, startDate, endDate, defaultDate } = this.state;
    // let tempDefaultValue = [];
    return (
      <div className='kunge_filter' onClick={(e) => e.stopPropagation()}>
        {/* <NavBar onLeftClick={()=>{tempBackBillItem=null;this.setState({open:!this.state.open})}} title={'筛选'} /> */}
        <List>
          <InputItem clear className='input-white' onChange={(value) => this.onInputChange('product', value)} placeholder='请输入' value={batchNo}>商品</InputItem>
          <div className='uretail_date'>
            <span style={{ float: 'left', margin: '0.15rem 0.3rem 0 0' }}>单据日期</span>
            <Flex onClick={() => this.onInputFocus('start')}>
              <Flex.Item>
                <InputItem placeholder='开始日期' disabled clear onChange={this.onInputChange('start')} onClick={() => this.onInputFocus('start')} value={startDate} />
              </Flex.Item> - <Flex.Item>
                <InputItem placeholder='结束日期' disabled clear onChange={this.onInputChange('end')} onClick={() => this.onInputFocus('end')} value={endDate} />
              </Flex.Item>
            </Flex>
          </div>
          <InputItem className='input-white' clear onBlur={this.onInputBlur} onChange={(value) => this.onInputChange('member', value)} placeholder='会员/手机号' value={phone}>会员</InputItem>
          {/* <InputItem clear onBlur={this.onInputBlur} onChange={(value)=>this.onInputChange('phone',value)} placeholder="请输入" value={phone}>手机号</InputItem> */}
        </List>

        <Calendar
          visible={this.state.show}
          onCancel={this.onCancel.bind(this)}
          onConfirm={this.onConfirm.bind(this)}
          defaultValue={defaultDate}
          onClear={this.onClear.bind(this)}
        />
        <Flex className='filter-footer-button'>
          <Flex.Item>
            <Button onClick={this.onReset}>重置</Button>
          </Flex.Item>
          <Flex.Item>
            <Button onClick={this.onOk}>确定</Button>
          </Flex.Item>
        </Flex>
      </div>
    )
  }

  switchSearchPanel () {
    this.setState({ searchStatus: true });
    setTimeout(function () {
      this.refs.cusSearchBarRef.focus();
    }.bind(this), 200);
  }

  render () {
    const { pSize, isRefreshing, tempData, isBackInfoVisible, backBillItem, searchTxt, searchStatus, isShowRTop } = this.state;
    const height = document.documentElement.offsetHeight - (window.__fontUnit * 0.28 + 44);
    const filterView = this.filterView();
    if (!isLoadings) {
      cb.utils.loadingControl.start();
    } else {
      cb.utils.loadingControl.end();
    }
    return (
      <div>
        <Drawer
          className='backbill-drawer'
          style={{ minHeight: document.documentElement.clientHeight }}
          position='right'
          touch={false}
          transitions={true}
          contentStyle={{ color: '#A6A6A6', textAlign: 'center' }}
          sidebar={filterView}
          open={this.state.open}
          onOpenChange={() => { this.setState({ open: !this.state.open, isShowRTop: (!isShowRTop ? true : isShowRTop) }) }}
        >
          <div>
            {
              !searchStatus ? (<NavBar title='选择退货单' rightContent={<div className='backbilling-search'><span><i onClick={this.switchSearchPanel.bind(this)} className='icon icon-sousuo' /></span><span onClick={() => this.setState({ open: !this.state.open, isShowRTop: (isShowRTop ? false : isShowRTop) })}> <i className='icon icon-shaixuan' /></span></div>} />)
                : (<SearchBar style={{ paddingTop: '0.4rem' }} ref='cusSearchBarRef' value={searchTxt} placeholder='单据编号' onSubmit={this.onOk} onChange={(value) => this.onInputChange('searchtxt', value)} onClear={() => this.setState({ searchTxt: '', searchStatus: false })} onCancel={() => this.onCancel('search')} />)
            }
            {!isLoadings ? '' : tempData.length === 0
              ? ( <div className={isSearch ? 'refer_no_order' : 'refer_no_data'} />)
              : <div className='kg_billback_list'>
                <ListView
                  ref={el => { this.lv = el }}
                  key='listview'
                  initialListSize={20}
                  renderFooter={this.renderFooter}
                  renderSeparator={this.renderSeparator}
                  dataSource={this.state.dataSource}
                  useBodyScroll={false}
                  style={{ height: height }}
                  renderRow={this.renderList.bind(this)}
                  onEndReachedThreshold={200}
                  onEndReached={this.onEndReached}
                  onScroll={(e) => { this.scrollListener(e) }}
                  pullToRefresh={
                    <PullToRefresh
                      refreshing={isRefreshing}
                      onRefresh={this.onRefresh}
                    />
                  }
                  pageSize={pSize}
                />
              </div>
            }
          </div>
        </Drawer>
        {!isBackInfoVisible ? '' : <div className='backbill_info_cls'><BackBillInfo retailItem={backBillItem} onBackBillBack={() => this.onBackBillBack.bind(this)} /></div>}

        <div className='return-top' style={{ display: (isShowRTop ? 'block' : 'none') }} onClick={this.returnTop.bind(this)}>
          <SvgIcon type='fanhuidingbu' />
        </div>

      </div>
    )
  }

  // 滚动事件监听
  scrollListener (e) {
    const y = e.target.scrollTop;
    const height = document.documentElement.offsetHeight - (window.__fontUnit * 1.28) + 22;
    // if(y>=60 && this.state.isRefresh!==true){
    //     this.setState({isRefresh:true});
    // }
    if (parseInt(y) >= height) {
      this.setState({ isShowRTop: true });
    }
  }

  // 返回到顶部事件
  returnTop (obj) {
    if (this.lv) {
      this.setState({ isShowRTop: false });
      this.lv.scrollTo(0, 0);
    }
  }
}

function mapStateToProps (state) {
  return {
    backBill: state.backBill.toJS(),
    config: state.config.toJS(),
    state
  }
}

function mapDispatchToProps (dispatch) {
  return {
    backBillAction: bindActionCreators(backBill, dispatch),
    dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(BackBills)
