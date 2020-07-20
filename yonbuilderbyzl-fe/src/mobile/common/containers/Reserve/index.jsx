import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as reserveActions from 'src/common/redux/modules/billing/reserve'
import * as unsubscribeActions from 'src/common/redux/modules/billing/unsubscribe'
import * as uretailHeaderActions from 'src/common/redux/modules/billing/uretailHeader'
import * as billingActions from '../../reducers/modules/billing'
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar'
import { SearchBar } from 'antd-mobile';
import ReverseList from '../../components/ReverseList'
import ReserveDetail from './reserveDetail'
import './style.css'
import { push } from 'react-router-redux'
import { clear } from 'src/common/redux/modules/billing/mix'
import SvgIcon from '@mdf/metaui-web/lib/components/common/SvgIcon'

let tabIndex = 0;
let stop = 0;
class Reserves extends Component {
  constructor (props) {
    super(props);
    // 设置状态栏字体黑色
    cb.utils.setStatusBarStyle('dark');
    this.state = {
      isLoading: false, searchTxt: '', isClear: false, searchStatus: false, isSearch: false,
      isOpen: false, detailObj: null, isRefresh: false, isShowRTop: false, page: {}
    };
  }

  componentWillMount () {
  }

  componentDidMount () {
    const { unsubscribe } = this.props;
    const { page } = unsubscribe;
    // const { searchTxt } = page;
    this.loadListData(true, page);
  }

  loadListData (bl, page) {
    if (page) {
      this.setState({ page, searchTxt: page.searchTxt });
    }
    if (bl === false) {
      this.loadList(page);
    } else {
      const { isLoading } = this.state;
      this.setState({ isLoading: !isLoading }, () => {
        this.loadList(page);
      });
    }
  }

  componentWillUnmount () {
    // let { reserveActions } = this.props;
    // reserveActions.getStoreInfo();
    // reserveActions.getBusinessType(true,"",true);
  }

  loadList (page) {
    const { reserve, unsubscribeActions, reserveActions, unsubscribe } = this.props;
    // let { pIndex, pSize } = unsubscribe.page;
    if (reserve.Region_DataSource === null || reserve.Region_DataSource.length === 0) {
      reserveActions.getRegion();
    }
    const { dataSource } = this.props.unsubscribe;
    if (!this.state.isClear && !cb.utils.isEmpty(dataSource) && (dataSource.totalCount <= dataSource.data.length)) {
      // this.setState({isTemLoading: false, refreshing: false});
      this.searchEvent('', 'Shipment');
      return;
    }
    this.setState({ isClear: false });
    unsubscribeActions.unsubscribe(true, null, null, '', null, null, function () {
      if (unsubscribe.dataSource === null || dataSource.totalCount > dataSource.data.length) {
        this.setState({ isLoading: false, isTemLoading: false, refreshing: false });
      } else {
        this.setState({ isTemLoading: false, refreshing: false });
      }
    }.bind(this), page);
  }

  onTabChange (index) {
    let type = '';
    tabIndex = index;
    switch (tabIndex) {
      case 0: type = 'Shipment'; break;
      case 1: type = 'Shipment'; break;
      case 2: type = 'PresellBack'; break;
      case 3: type = 'PresellBack'; break;
    }
    this.setState({ searchTxt: '' }, function () {
      this.searchEvent('', type);
    }.bind(this));
  }

  onSearch () {
    if (!cb.utils.isEmpty(this.state.searchTxt)) {
      this.setState({ isSearch: true });
      this.searchEvent(this.state.searchTxt);
    }
  }

  onCancel (type, ) {
    if (type === 'clear') {
      this.setState({ searchTxt: '' }, function () {
        //   this.searchEvent('');
      });
    } else if (type === 'cancel') {
      let isResetData = false;
      const { searchTxt } = this.props.unsubscribe.page;
      if (searchTxt && searchTxt.length > 0) {
        isResetData = true;
      }
      this.setState({ searchTxt: '', searchStatus: false, isSearch: false }, function () {
        if (isResetData) {
          this.searchEvent('');
        }
      }.bind(this));
      // this.setState({searchTxt:''});
    }
  }

  searchEvent (value, type, status) {
    const { unsubscribe, unsubscribeActions } = this.props;
    this.setState({ isClear: true, isRefresh: false, refreshing: true }, function () {
      unsubscribeActions.initPageInfo();
      if (status !== 'refresh') {
        unsubscribeActions.clearDataSource(null);
      }
      const { page } = unsubscribe;
      page.pIndex = 1;
      page.searchTxt = value;
      if (type) {
        page.type = type;
      }
      this.loadListData(false, page);
    }.bind(this))
  }

  listScroll (e) {
    const target = e.currentTarget;
    // this.setState({viewtarget:target});
    if (parseInt(target.clientHeight) + parseInt(target.scrollTop) > (parseInt(target.scrollHeight) - 80)) {
      const { unsubscribe, } = this.props;
      const { isLoading } = this.state;
      if (unsubscribe.dataSource === null || unsubscribe.dataSource.totalCount === null) {
        return;
      }
      if (unsubscribe.dataSource.totalCount > unsubscribe.dataSource.data.length && !isLoading) {
        this.setState({ isLoading: !isLoading }, () => {
          const page = unsubscribe.page;
          page.pIndex = (parseInt(page.pIndex) + 1);
          // unsubscribeActions.setPageInfo(page);
          this.loadListData(false, page);
        });
      }
    }
  }

  loadindData () {
    const { unsubscribe } = this.props;
    const { isLoading } = this.state;
    if (unsubscribe.dataSource === null || unsubscribe.dataSource.totalCount === null) {
      return;
    }
    if (unsubscribe.dataSource.totalCount > unsubscribe.dataSource.data.length && !isLoading) {
      this.setState({ isLoading: !isLoading, isTemLoading: true }, () => {
        const page = unsubscribe.page;
        page.pIndex = (parseInt(page.pIndex) + 1);
        // unsubscribeActions.setPageInfo(page);
        this.loadListData(false, page);
      });
    }
  }

  onChange (type, value) {
    if (type === 'search') {
      this.setState({ searchTxt: value });
    }
  }

  onLeftClick () {
    cb.utils.setStatusBarStyle('light');
    this.props.history.goBack();
  }

  newReserve () {
    const { clear, uretailHeaderActions, reserveActions, dispatch } = this.props;
    clear();
    uretailHeaderActions.ModifyBillStatus('PresellBill');
    // reserveActions.getBusinessType(true, "PresellBill", true, null, true);
    reserveActions.showReserve();
    dispatch(push('/billing'));
  }

  switchSearchPanel () {
    this.setState({ searchStatus: true });
    setTimeout(function () {
      if (this.state.scrollObj && stop === 0) {
        this.state.scrollObj.scrollTo(0, 2);
      }
      this.refs.cusSearchBarRef.focus();
    }.bind(this), 200);
  }

  openDetailView (obj) {
    if (this.state.isOpen) {
      this.setState({ isOpen: false, detailObj: null });
    } else {
      this.setState({ isOpen: true, detailObj: obj });
    }
  }

  render () {
    const { unsubscribe } = this.props;
    const { searchStatus, isSearch, isOpen, detailObj, isShowRTop } = this.state;
    const height = window.screen.height - (window.__fontUnit * 1.28) + 22;
    const width = document.documentElement.offsetWidth - (window.__fontUnit * 2.6);

    let dataNum = 0;
    if (unsubscribe.dataSource) {
      dataNum = unsubscribe.dataSource.data.length;
    } else {
      dataNum = -1;
    }

    if (dataNum < 0) {
      cb.utils.loadingControl.start();
    } else {
      cb.utils.loadingControl.end();
    }

    return (
      <div className='reserve_contail_c' style={{ height: document.documentElement.clientHeight + 'px' }}>
        {
          searchStatus ? (
            <SearchBar ref='cusSearchBarRef' value={this.state.searchTxt} placeholder='单据编号/联系人/联系电话' onSubmit={this.onSearch.bind(this)} onChange={this.onChange.bind(this, 'search')} onClear={this.onCancel.bind(this, 'clear')} onCancel={this.onCancel.bind(this, 'cancel')} />
          ) : (
            <NavBar title='预订单' onLeftClick={this.onLeftClick.bind(this)} rightContent={<div><span><i onClick={this.switchSearchPanel.bind(this)} className='icon icon-sousuo' /></span><span onClick={this.newReserve.bind(this)}><i className='icon icon-xinzeng' /></span></div>} />
          )
        }
        {/* <div className='reserves_list_view_tip' style={{display:((unsubscribe.dataSource===null || unsubscribe.dataSource.totalCount===0)?'none':'block')}}>{isRefresh?'松开刷新列表':'下拉刷新'}</div> */}
        {dataNum === 0 ? '' : isSearch ? (

          // <MyScroll init={this.scrollInit.bind(this)} refreshData={this.searchEvent.bind(this,'','Shipment')} loadData={ this.loadindData.bind(this) } ID="myWrapper">
          ''// <ReverseList width={width} height={height} onScroll={this.scrollListener.bind(this)} init={this.scrollInit.bind(this)} onOpenDetail={this.openDetailView.bind(this)} data={unsubscribe.dataSource} type={unsubscribe.page.type} refreshList={this.searchEvent.bind(this, '', 'Shipment', 'refresh').bind(this)} loadMore={this.loadindData.bind(this)} refreshing={this.state.refreshing} isLoading={this.state.isTemLoading} />
          // </MyScroll>
        ) : (

        /** <Tabs tabs={tabs}
                initialPage={1}
                onChange={(tab, index) => { this.onTabChange(index) }}
                onTabClick={(tab, index) => { console.log('onTabClick', index, tab); }} >**/
        // <div style={{height:'100%',overflowY:'scroll'}}  onScroll={this.listScroll.bind(this)}>
        // <MyScroll init={this.scrollInit.bind(this)} refreshData={this.searchEvent.bind(this,'','Shipment')} loadData={ this.loadindData.bind(this) } ID="myWrapper">
          ''// <ReverseList width={width} height={height} onScroll={this.scrollListener.bind(this)} init={this.scrollInit.bind(this)} onOpenDetail={this.openDetailView.bind(this)} data={unsubscribe.dataSource} type={unsubscribe.page.type} refreshList={this.searchEvent.bind(this, '', 'Shipment', 'refresh').bind(this)} loadMore={this.loadindData.bind(this)} refreshing={this.state.refreshing} isLoading={this.state.isTemLoading} />
        // </MyScroll>
        // </div>
        /** </Tabs>**/

        )}
        {dataNum === 0 ? (<div className={isSearch ? 'refer_no_order' : 'refer_no_data'} />) : (dataNum < 0 ? '' : <ReverseList width={width} height={height} onScroll={this.scrollListener.bind(this)} init={this.scrollInit.bind(this)} onOpenDetail={this.openDetailView.bind(this)} data={unsubscribe.dataSource} type={unsubscribe.page.type} refreshList={this.searchEvent.bind(this, '', 'Shipment', 'refresh').bind(this)} loadMore={this.loadindData.bind(this)} refreshing={this.state.refreshing} isLoading={this.state.isTemLoading} />)}
        <div className='return-top' style={{ display: (isShowRTop ? 'block' : 'none') }} onClick={this.returnTop.bind(this)}>
          <SvgIcon type='fanhuidingbu' />
        </div>
        <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', zIndex: '100', display: (isOpen ? 'block' : 'none') }}>
          {
            detailObj != null ? (<ReserveDetail onOpenDetail={this.openDetailView.bind(this)} data={detailObj} />) : ''
          }
        </div>
      </div>
    )
  }

  scrollInit (obj) {
    this.setState({ scrollObj: obj });
    // return this.scrollListener.bind(this);
  }

  // 滚动事件监听
  scrollListener (e) {
    const y = e.target.scrollTop;
    stop = y;
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
    if (this.state.scrollObj) {
      this.setState({ isShowRTop: false });
      this.state.scrollObj.scrollTo(0, 0);
      stop = 0;
    }
  }
}

function mapStateToProps (state) {
  return {
    unsubscribe: state.unsubscribe.toJS(),
    reserve: state.reserve.toJS(),
    user: state.user.toJS()
  }
}

function mapDispatchToProps (dispatch) {
  return {
    reserveActions: bindActionCreators(reserveActions, dispatch),
    billingActions: bindActionCreators(billingActions, dispatch),
    unsubscribeActions: bindActionCreators(unsubscribeActions, dispatch),
    uretailHeaderActions: bindActionCreators(uretailHeaderActions, dispatch),
    clear: bindActionCreators(clear, dispatch),
    dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Reserves)
