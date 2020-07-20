import Immutable from 'immutable';
import { handleActions } from 'redux-actions'
import * as actions from '../../constants/reserve'

const $$initState = Immutable.fromJS({
  reserve: {},
  list: {}
});

export default handleActions({
  [actions.RESERVE_ADD]: ($$state, action) => {
    return $$state.set('reserve', action.payload);
  },
  [actions.RESERVE_GET_LIST]: ($$state, action) => {
    // let payload = action.payload;
    // if(!cb.utils.isEmpty($$state.get('list').data)){
    //     let data = $$state.get('list').data;
    //     data.push.apply(data,payload.data);
    //     payload.data = data;
    // }
    return $$state.set('list', action.payload);
  }
}, $$initState)
