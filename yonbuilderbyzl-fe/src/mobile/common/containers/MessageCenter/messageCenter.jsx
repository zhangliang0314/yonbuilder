import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import NavBar from '@mdf/metaui-mobile/lib/components/NavBar'
// import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
import SvgIcon from '@mdf/metaui-web/lib/components/common/SvgIcon';
// import Row from '@mdf/metaui-web/lib/components/basic/row';
// import Col from '@mdf/metaui-web/lib/components/basic/col';
import { Button, SwipeAction, List, Tabs, Drawer, Flex, InputItem, Calendar } from 'antd-mobile';// Switch,
// import * as  eChartCommon from '@mdf/metaui-web/lib/components/echart/eChartCommon';
import * as messageActions from '../../reducers/modules/messageList'
import moment from 'moment';
import { dateFormat } from '@mdf/cube/lib/helpers/formatDate';
import { push } from 'react-router-redux';
import * as treeactions from '@mdf/metaui-web/lib/redux/tree'

class MessageCenter extends Component {
  constructor (props) {
    super(props);
    this.state = {
      open: false,
      startDate: '',
      endDate: '',
      show: false,
      defaultDate: [],
      searchContent: '',
      isShowRTop: false,
      tabIndex: 0,
      readedClassName: 'refer_no_infor',
      unreadClassName: 'refer_no_infor',
    }
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
    if (this.refs.scrolllist) {
      this.setState({ isShowRTop: false });
      this.refs.scrolllist.scrollTo(0, 0);
    }
  }

  onTabChange = (tab, index) => {
    this.setState({ tabIndex: index });
    this.returnTop();
  }

  getTabs = () => {
    const tabs = [
      { title: '未读' },
      { title: '已读' }
    ]
    return (
      // <div className='messageList_tab'>
      <Tabs tabs={tabs}
        // initialPage={0}
        swipeable={false}
        page={this.state.tabIndex}
        onChange={this.onTabChange}
      >
        {/* <div ref={el => { this.lv = el }}>
            {this.getUnreadList()}
            <span className='refer_no_infor'>没有更多了哦~</span>
          </div>
          <div ref={el => { this.lv = el }} onScroll={(e) => { this.scrollListener(e) }}>
            {this.getReadedList()}
            <span className='refer_no_infor'>没有更多了哦~</span>
          </div> */}
      </Tabs>
      // </div>
    )
  }

  getReadedList = () => {
    const Item = List.Item;
    const { readMessageData } = this.props.messageList;
    let sendTime;
    const readList = [];
    readMessageData.forEach((ele) => {
      if (moment(ele.sendTime, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD') == moment().format('YYYY-MM-DD')) {
        sendTime = moment(ele.sendTime, 'YYYY-MM-DD HH:mm:ss').format('HH:mm')
      } else if (moment(ele.sendTime, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD') == moment().add(-1, 'days').format('YYYY-MM-DD')) {
        sendTime = '昨天'
      } else {
        sendTime = moment(ele.sendTime, 'YYYY-MM-DD HH:mm:ss').format('MM-DD')
      }
      readList.push(<SwipeAction
        // style={{ backgroundColor: 'gray' }}
        autoClose
        right={[
          {
            text: ' ',
            onPress: () => { this.props.messageActions.deleteMessage([{ id: ele.id, pubts: ele.pubts }]) },
            // style: { backgroundColor: '#F4333C', color: 'white' },
          },
        ]}
      ><Item useOnPan={true} wrap extra={sendTime} className='readed_list_item' onClick={() => this.viewDetail(ele)}>{ele.content}</Item></SwipeAction>
      )
    })
    return (readMessageData.length == 0 ? <div className={this.state.readedClassName} /> : <div>
      <List ref='listRef' className='read-list'>
        {readList}
      </List>
      <span className='nomore_info'>没有更多了哦~</span></div>

    )
  }

  viewDetail = (rowData) => {
    // this.props.historyPush('./messageDetail')
    this.props.treeactions.execHandler(rowData.menucode, { query: { key: 'subscriptionId', value: rowData.subscription } });
  }

  getUnreadList = () => {
    const Item = List.Item;
    const { UnreadMessageData } = this.props.messageList;
    let sendTime;
    const unreadList = [];
    UnreadMessageData.forEach((ele) => {
      if (moment(ele.sendTime, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD') == moment().format('YYYY-MM-DD')) {
        sendTime = moment(ele.sendTime, 'YYYY-MM-DD HH:mm:ss').format('HH:mm')
      } else if (moment(ele.sendTime, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD') == moment().add(-1, 'days').format('YYYY-MM-DD')) {
        sendTime = '昨天'
      } else {
        sendTime = moment(ele.sendTime, 'YYYY-MM-DD HH:mm:ss').format('MM-DD')
      }
      unreadList.push(<SwipeAction
        // style={{ backgroundColor: 'gray' }}
        autoClose
        right={[
          {
            text: ' ',
            onPress: () => { this.props.messageActions.markReaded([{ id: ele.id }]) },
            // style: { backgroundColor: '#ddd', color: 'white' },
          },
          {
            text: ' ',
            onPress: () => { this.props.messageActions.deleteMessage([{ id: ele.id, pubts: ele.pubts }]) },
            // style: { backgroundColor: '#F4333C', color: 'white' },
          },
        ]}
      ><Item useOnPan={true} className='unread_list_item' wrap extra={sendTime} onClick={() => this.viewDetail(ele)}>{ele.content}</Item></SwipeAction>)
    })
    return (UnreadMessageData.length == 0 ? <div className={this.state.unreadClassName} /> : <div>
      <List ref='unreadlist' className='unread-list'>
        {unreadList}
      </List>
      <span className='nomore_info'>没有更多了哦~</span>  </div>
    )
  }

  markAllReaded = () => {
    cb.utils.confirm('确定全部标为已读吗？', () => {
      const { UnreadMessageData } = this.props.messageList;
      const idGroups = [];
      UnreadMessageData.forEach((ele) => {
        idGroups.push({ id: ele.id })
      })
      this.props.messageActions.markAllReaded(idGroups)
    })
  }

  onInputChange = (type, value) => {
    if (type === 'content') {
      this.setState({ searchContent: value });
    }
  }

  onCancel = () => {
    this.setState({ show: !this.state.show, });
  }

  onReset = () => {
    this.setState({
      searchContent: '',
      startDate: '',
      endDate: '',
      defaultDate: [],
    })
  }

  onDrawerOpenChange = () => {
    this.setState({ open: !this.state.open, isShowRTop: false, });
  }

  onInputFocus = () => {
    this.setState({ show: !this.state.show });
  }

  onInputBlur = () => {

  }

  onConfirm (start, end) {
    const tstart = dateFormat(start, 'yyyy-MM-dd');
    const tend = dateFormat(end, 'yyyy-MM-dd');
    this.setState({ show: false, startDate: tstart, endDate: tend, defaultDate: [start, end] });
  }

  onClear = () => {
    this.setState({ startDate: '', endDate: '', defaultDate: [] });
  }

  onOk = () => {
    const { startDate, endDate, searchContent } = this.state
    this.props.messageActions.filterOkRead(searchContent, startDate, endDate)
    this.props.messageActions.filterOkUnread(searchContent, startDate, endDate)
    const{readRecord, unreadRecord} = this.props.messageList;
    if(readRecord.length == 0) { this.setState({readedClassName: 'refer_no_date'}) }
    if(unreadRecord.length == 0) { this.setState({unreadClassName: 'refer_no_date'}) }
    this.setState({ open: false })
  }

  filterView () {
    const { searchContent, startDate, endDate, defaultDate } = this.state;
    return (
      <div className='kunge_filter' onClick={(e) => e.stopPropagation()}>
        {/* <NavBar onLeftClick={()=>{tempBackBillItem=null;this.setState({open:!this.state.open})}} title={'筛选'} /> */}
        <List>
          <div className='uretail_date'>
            <span style={{ float: 'left', margin: '0.15rem 0.3rem 0 0' }}>推送时间</span>
            <Flex onClick={() => this.onInputFocus('start')}>
              <Flex.Item>
                <InputItem placeholder='开始日期' disabled clear onChange={this.onInputChange('start')} onClick={() => this.onInputFocus('start')} value={startDate} />
              </Flex.Item> - <Flex.Item>
                <InputItem placeholder='结束日期' disabled clear onChange={this.onInputChange('end')} onClick={() => this.onInputFocus('end')} value={endDate} />
              </Flex.Item>
            </Flex>
          </div>
          <InputItem className='input-white' clear onBlur={this.onInputBlur} onChange={(value) => this.onInputChange('content', value)} placeholder='请输入' value={searchContent}>消息内容</InputItem>
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

  render () {
    const readedIcon = this.props.messageList.UnreadMessageData.length == 0 ? <SvgIcon className='disabled_icon' type='biaoweiyidu-copy' style={{ width: '0.50rem', height: '0.50rem' }} /> : <SvgIcon type='biaoweiyidu-copy' style={{ width: '0.50rem', height: '0.50rem' }} onClick={this.markAllReaded} />;
    const filterView = this.filterView();
    const { isShowRTop } = this.state;
    let listControl; const style = { overflow: 'auto' };
    if (this.state.tabIndex == 0)
      listControl = this.getUnreadList();
    else
      listControl = this.getReadedList();
    return (
      <div>
        <Drawer
          className='backbill-drawer message'
          style={{ minHeight: document.documentElement.clientHeight }}
          position='right'
          touch={false}
          transitions={true}
          open={this.state.open}
          sidebar={filterView}
          contentStyle={{ color: '#A6A6A6', textAlign: 'center' }}
          onOpenChange={this.onDrawerOpenChange}
        >
          <div className='reserve_contail_c' style={{ height: document.documentElement.clientHeight + 'px' }}>
            <NavBar title='消息' rightContent={<div><span>{readedIcon}<SvgIcon type='shaixuan' style={{ width: '0.50rem', height: '0.50rem' }} onClick={this.onDrawerOpenChange} /></span></div>} />
            <div className='messageList_tab'>
              {this.getTabs()}
              <div ref='scrolllist' className='scroll_list' style={style} onScroll={e => this.scrollListener(e)}>{listControl}</div>
              {/* <span className='refer_no_infor'>没有更多了哦~</span> */}
            </div>
          </div>
        </Drawer>
        <div className='return-top' style={{ display: (isShowRTop ? 'block' : 'none') }} onClick={this.returnTop.bind(this)}>
          <SvgIcon type='fanhuidingbu' />
        </div>
      </div>

    )
  }
}

function mapStateToProps (state) {
  return {
    messageList: state.messageList.toJS(),
    // user: state.user.toJS()
  }
}

function mapDispatchToProps (dispatch) {
  return {
    historyPush: bindActionCreators(push, dispatch),
    messageActions: bindActionCreators(messageActions, dispatch),
    treeactions: bindActionCreators(treeactions, dispatch),
    dispatch
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MessageCenter)
