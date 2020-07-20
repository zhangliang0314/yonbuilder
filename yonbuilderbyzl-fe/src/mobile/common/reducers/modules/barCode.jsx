import {handleActions} from 'redux-actions'
import Immutable from 'immutable'
import * as barCodeActions from '../../constants/barCode'

const $$initCodes = Immutable.fromJS({
  id: '',
  codes: []
});

export default handleActions({
  [barCodeActions.ADD_BAR_CODE]: ($$state, action) => {
    const codes = $$state.get('codes');
    let num = 1;
    if(codes.has(action.payload)) {
      num = codes.find((item) => {
        if(item.get('code') === action.payload) {
          return item.num + 1;
        }
      });
    }
    return $$state.set('codes', $$state.get('codes').push({code: action.payload, num: num}));
  },
  [barCodeActions.MODIFY_BAR_CODE]: ($$state, action) => {
    const obj = action.payload;
    obj.num = obj.num + 1;
    return $$state;
  },
  [barCodeActions.DELETE_BAR_CODE]: ($$state, action) => {
    console.log('delete');
  }

}, $$initCodes);
