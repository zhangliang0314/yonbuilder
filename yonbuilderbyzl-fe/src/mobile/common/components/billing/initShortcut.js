/**
 * Created by janeluck on 17/9/26.
 */
import _ from 'lodash'
import {executeAction} from 'src/common/redux/modules/billing/config'
// import getEventTarget from 'react-dom/lib/getEventTarget.js'
import Shortcut from './shortcut'
var TEXT_NODE = 3;
/**
 * Gets the target node from a native browser event by accounting for
 * inconsistencies in browser DOM APIs.
 *
 * @param {object} nativeEvent Native browser event.
 * @return {DOMEventTarget} Target node.
 */
function getEventTarget (nativeEvent) {
  // Fallback to nativeEvent.srcElement for IE9
  // https://github.com/facebook/react/issues/12506
  var target = nativeEvent.target || nativeEvent.srcElement || window;

  // Normalize SVG <use> element events #4963
  if (target.correspondingUseElement) {
    target = target.correspondingUseElement;
  }

  // Safari may fire events on text nodes (Node.TEXT_NODE is 3).
  // @see http://www.quirksmode.org/js/events_properties.html
  return target.nodeType === TEXT_NODE ? target.parentNode : target;
}

export default function (functionKeys, dispatch) {
  // 组织所有的快捷键信息生成数组

  const shortcutsArr = _.flatten(_.map(functionKeys))

  // 初始化快捷键

  const sc = new Shortcut()
  sc.add(_.map(shortcutsArr, (item) => {
    return {
      shortCut: item.hotKeyExec,
      callback: function (nativeEvent) {
        console.log(`${item.command},${item.hotKeyExec}`)
        dispatch(executeAction(item.command, item))
      },
      getEnableState: function (nativeEvent) {
        // 打开modal层时禁用bill快捷键
        const modalMask = document.getElementsByClassName('ant-modal-mask') || []

        if (_.every(modalMask, mask => !!mask.classList.toString().match('ant-modal-mask-hidden') || !!mask.classList.toString().match('uretail-loading-bg'))) {
          // 开单首页商品录入框触发快捷键，其他输入文本类不触发
          const target = getEventTarget(nativeEvent)
          if (target.tagName == 'INPUT' || target.tagName == 'TEXTAREA') {
            // checkbox类触发
            return target.type === 'checkbox' || target.dataset.id === 'barcodeInput'
          }
          return true
        }
        return false
      }
    }
  }))
}
