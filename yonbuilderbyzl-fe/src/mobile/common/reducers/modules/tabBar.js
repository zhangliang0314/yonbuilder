import {handleActions} from 'redux-actions'
import Immutable from 'immutable'
import {createAction} from 'redux-actions'

export const TOGGLE_TABBAR = 'TOGGLE_TABBAR'
export const toggle_tabbar = createAction(TOGGLE_TABBAR)

const tabbardata = [
  {
    title: '首页',
    id: 0,
    icon: 'shouye',
    activeIcon: 'activeshouye'
  },
  // {
  //   title: '工作台',
  //   id: 1,
  //   icon: 'workshop',
  //   activeIcon: 'activeworkshop'

  // },  {
  //   title: '会员中心',
  //   id: 2,
  //   icon: 'accountcenter',
  //   activeIcon: 'activeaccountcenter'

  // },
  {
    title: '分析',
    id: 1,
    icon: 'workshop',
    activeIcon: 'activeworkshop'
  },
  {
    title: '看板',
    id: 2,
    icon: 'kanban',
    activeIcon: 'activekanban'
  },
  {
    title: '我的',
    id: 3,
    icon: 'mine',
    activeIcon: 'activemine'
  },

]

const initialState = Immutable.Map({
  activeTabID: 0,
  tabs: Immutable.List(tabbardata)
})
export default handleActions({
  TOGGLE_TABBAR: (state, action) => {
    return state.update('activeTabID', () => action.payload)
  }

}, initialState)
