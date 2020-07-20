import Immutable from 'immutable';
import { genAction, proxy } from '@mdf/cube/lib/helpers/util';
// import { initConfig } from 'src/common/redux/modules/billing/config'
// import { getDefaultBusinessType } from 'src/common/redux/modules/billing/reserve'

let filterId, solutionId;

const initialState = {
  UnreadMessageData: [],
  readMessageData: [],
  value: '',
  readRecord: [],
  unreadRecord: [],
}

export default ($$state = Immutable.fromJS(initialState), action) => {
  switch (action.type) {
    case 'URETAIL_MOBILE_MESSAGE_SET_OPTIONS':
      return $$state.merge(action.payload)
    // case "PLATFORM_UI_BILLING_CLEAR":
    //   return $$state.merge({ isAgainBilling: false, isReturnSale: true });
    default:
      return $$state
  }
}

export function getIds () {
  return async function (dispatch, getState) {
    let config = {
      url: '/billmeta/getbill?billno=aa_messagelist&bIncludeViewModel=true',
      method: 'GET',
      params: {
      }
    }
    let json = await proxy(config);
    if(json.code !== 200) {
      cb.utils.alert(json.message, 'error');
      return
    }
    filterId = json.data.viewmodel.cFilterId;
    config = {
      url: 'filterDesign/getSolutionList',
      method: 'POST',
      params: {
        filterId: filterId
      }
    }
    json = await proxy(config);
    if(json.code !== 200) {
      cb.utils.alert(json.message, 'error');
      return
    }
    solutionId = json.data[0].id;
  }
}

export function getUnreadMessageData () {
  return async function (dispatch, getState) {
    // const { filterId,solutionId} = getState().messageList.toJS();

    const config = {
      url: 'bill/list.do',
      method: 'POST',
      params: {
        billnum: 'aa_messagelist',
        // page: {pageSize: 10, pageIndex: 1},
        // condition: {
        //   simpleVOs: [{
        //     field: 'status',
        //     op: 'eq',
        //     value1: false,
        //    }]
        // }
        condition: {commonVOs: [{itemName: 'schemeName', value1: 'aa_messagelist'}, {itemName: 'isDefault', value1: false}, {value1: 'false', itemName: 'status'}], filtersId: filterId, solutionId: solutionId}
      }
    }
    const json = await proxy(config);
    if(json.code !== 200) {
      cb.utils.alert(json.message, 'error');
      return
    }
    let data = []
    if(json.data && json.data.recordList)
      data = json.data.recordList
    const value = data.length
    dispatch(genAction('URETAIL_MOBILE_MESSAGE_SET_OPTIONS', {UnreadMessageData: data, value}))
  }
}

export function getReadedMessageData () {
  return async function (dispatch, getState) {
    // const { filterId,solutionId} = getState().messageList.toJS();
    const config = {
      url: 'bill/list.do',
      method: 'POST',
      params: {
        billnum: 'aa_messagelist',
        // page: {pageSize: 10, pageIndex: 1},
        condition: {commonVOs: [{itemName: 'schemeName', value1: 'aa_messagelist'}, {itemName: 'isDefault', value1: false}, {value1: 'true', itemName: 'status'}], filtersId: filterId, solutionId: solutionId}}
    }
    const json = await proxy(config);
    if(json.code !== 200) {
      cb.utils.alert(json.message, 'error');
      return
    }
    let data = []
    if(json.data && json.data.recordList)
      data = json.data.recordList
    dispatch(genAction('URETAIL_MOBILE_MESSAGE_SET_OPTIONS', {readMessageData: data}))
  }
}

export function markReaded (id) {
  return async function (dispatch) {
    const config = {
      url: '/bill/batchDo?action=batchread',
      method: 'POST',
      params: {
        billnum: 'aa_messagelist',
        data: JSON.stringify(id)
      }
    }
    const json = await proxy(config);
    if(json.code !== 200) {
      cb.utis.alert(json.message, 'error')
      return
    }
    if(json.data.failCount > 0) {
      const error = json.data.messages.toString()
      cb.utils.alert(error, 'error')
      return
    }
    cb.utils.alert('操作成功！')
    dispatch(getUnreadMessageData())
    dispatch(getReadedMessageData())
  }
}

export function markAllReaded (idGroup) {
  return async function (dispatch) {
    const config = {
      url: '/bill/batchDo?action=batchread',
      method: 'POST',
      params: {
        billnum: 'aa_messagelist',
        data: JSON.stringify(idGroup)
      }
    }
    const json = await proxy(config);
    if(json.code !== 200) {
      cb.utis.alert(json.message, 'error')
      return
    }
    if(json.data.failCount > 0) {
      const error = json.data.messages.toString()
      cb.utils.alert(error, 'error')
      return
    }
    cb.utils.alert('操作成功！')
    dispatch(getUnreadMessageData())
    dispatch(getReadedMessageData())
  }
}

export function deleteMessage (data) {
  return async function (dispatch) {
    const config = {
      url: 'bill/batchdelete.do',
      method: 'POST',
      params: {
        billnum: 'aa_messagelist',
        data: JSON.stringify(data)
      }
    }
    const json = await proxy(config);
    if(json.code !== 200) {
      cb.utis.alert(json.message, 'error')
      return
    }
    if(json.data.failCount > 0) {
      const error = json.data.messages.toString()
      cb.utils.alert(error, 'error')
      return
    }
    cb.utils.alert('操作成功！')
    dispatch(getUnreadMessageData())
    dispatch(getReadedMessageData())
  }
}

export function filterOkRead (searchContent, startDate, endDate) {
  return async function (dispatch, getState) {
    const config = {
      url: 'bill/list.do',
      method: 'POST',
      params: {
        billnum: 'aa_messagelist',
        // page: {pageSize: 10, pageIndex: 1},
        condition: {commonVOs: [{itemName: 'schemeName', value1: 'aa_messagelist'}, {itemName: 'isDefault', value1: false}, {value1: 'true', itemName: 'status'}, {value1: searchContent, itemName: 'content'}, {value1: startDate ? startDate + ' ' + '00:00:00' : null, value2: endDate ? endDate + ' ' + '23:59:59' : null, itemName: 'sendTime'}], filtersId: filterId, solutionId: solutionId}}
    }
    const json = await proxy(config);
    if(json.code !== 200) {
      cb.utils.alert(json.message, 'error');
      return
    }
    let data = []
    if(json.data && json.data.recordList)
      data = json.data.recordList
    dispatch(genAction('URETAIL_MOBILE_MESSAGE_SET_OPTIONS', {readMessageData: data, readRecord: data}))
  }
}

export function filterOkUnread (searchContent, startDate, endDate) {
  return async function (dispatch, getState) {
    const config = {
      url: 'bill/list.do',
      method: 'POST',
      params: {
        billnum: 'aa_messagelist',
        // page: {pageSize: 10, pageIndex: 1},
        condition: {commonVOs: [{itemName: 'schemeName', value1: 'aa_messagelist'}, {itemName: 'isDefault', value1: false}, {value1: 'false', itemName: 'status'}, {value1: searchContent, itemName: 'content'}, {value1: startDate ? startDate + ' ' + '00:00:00' : null, value2: endDate ? endDate + ' ' + '23:59:59' : null, itemName: 'sendTime'}], filtersId: filterId, solutionId: solutionId}}
    }
    const json = await proxy(config);
    if(json.code !== 200) {
      cb.utils.alert(json.message, 'error');
      return
    }
    let data = []
    if(json.data && json.data.recordList)
      data = json.data.recordList
    dispatch(genAction('URETAIL_MOBILE_MESSAGE_SET_OPTIONS', {UnreadMessageData: data, unreadRecord: data}))
  }
}
