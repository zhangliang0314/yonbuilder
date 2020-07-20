
const initialState = false
var count = 0
// reducer
export default (state = initialState, action) => {
  switch (action.type) {
    case 'PLATFORM_UI_TOGGLE_LOADING_BAR_STATUS':
      return action.status || count > 0
    default:
      return state
  }
}

// 切换加载状态
export function toggleLoadingStatus (status) {
  status ? count++ : count--
  return {
    type: 'PLATFORM_UI_TOGGLE_LOADING_BAR_STATUS',
    status
  }
}
