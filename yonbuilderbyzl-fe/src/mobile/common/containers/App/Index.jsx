import * as React from 'react'
import AppTabBar from 'src/common/containers/App/TabBar'
// import { proxy } from '@mdf/cube/lib/helpers/util';
// require('src/mobile/styles/globalCss/index.css')
export class App extends React.Component {
  constructor (props, context) {
    super(props, context)
  }

  componentDidMount () {
    this.loadingCount = 0;
    cb.utils.loadingControl = {
      start: () => {
        cb.utils.loading(true);
        this.loadingCount++;
        if (this.loadingCount === 1)
          this.setState({ loading: true });
      },
      end: () => {
        cb.utils.loading(false);
        if (this.loadingCount > 0)
          this.loadingCount--;
        if (this.loadingCount === 0)
          this.setState({ loading: false });
      }
    };
    if (cb.rest.isWeChat) {
      const container = window.document.getElementById('container')
      container.className = 'wechat-container'
      cb.utils.initWeChat();
    }
  }

  render () {
    return (
      <div className={cb.rest.isWeChat ? 'wechat-container' : ''}>
        <AppTabBar />
      </div>
    )
  }
}
