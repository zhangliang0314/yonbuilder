import React from 'react'
const JRoll = require('jroll')

export default class MyJRoll extends React.Component {
  constructor (props) {
    super(props)
    this.jroll = null;
  }

  componentDidMount () {
    const { refreshData, loadData, init } = this.props; // 下拉刷新、下拉加载、初始化传递过去的jroll滚动组件
    const wrappers = this.props.ID || 'wrappers'
    this.jroll = new JRoll(`#${wrappers}`, {scrollBarY: true, scrollBarFade: true, stopPropagation: false, preventDefault: false});
    let scrollListener = null;
    if(init) {
      scrollListener = init(this);
    }
    this.jroll.refresh();
    this.jroll.on('scrollStart', function () {
      // console.log(this.y); //输出当前x偏移量，this指向jroll对象
    });

    this.jroll.on('scrollEnd', function () {
      // 滚动结束
    });

    this.jroll.on('touchEnd', function () {
      if(this.y >= 80 && refreshData) {
        refreshData(); // 下拉刷新
      }
    });
    this.jroll.on('refresh', function () {
      // 刷新
    });
    this.jroll.on('scroll', function () {
      if ((this.maxScrollY + 100) > this.y && loadData) {
        loadData();
      }
      if(scrollListener !== null) {
        scrollListener(this.y);
      }
    });
  }

  componentDidUpdate () {
    this.jroll.refresh();
  }

  render () {
    const { height } = this.props
    return (
      <div id={this.props.ID ? this.props.ID : 'wrappers'} style={{height: height || '100%'}}>
        <ul id='scroller'>
          {this.props.children}
        </ul>
      </div>
    )
  }

  returnTop () {
    this.jroll.scrollTo(0, 0, 300, false);
  }
}
