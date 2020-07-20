import Immutable from 'node_modules0/immutable'
import Cookies from 'cookies-js'
import * as Actions from '../../constants/mine'
import { genAction, toJSON, proxy } from 'node_modules0/@mdf/cube/lib/helpers/util'
import { handleActions } from 'node_modules0/redux-actions'

const $$initialState = Immutable.fromJS({
    isShowModifyPage:false,
    fileurl:"",
    user:{
        nickName:"",
        avatar:"",
        id:""/**,
        department:null,
        department_name:null,
        email:"sunlim0022@yonyou.com",
        
        landLine:null,
        masterLandLine:null,
        mobile:"13547859858",
        name:"孙丽（零售1）",
        position:null,
        qq:null,
        tel:null,
        userType:1,
        wechat:null**/
    },
    departments:'',
    store:{}
});

export default handleActions({
    [Actions.MINE_MODIFY_INFO]:($$state,action)=>{
        return $$state.set("user",action.payload);
    },
    [Actions.MINE_MODIFYSTORE_INFO]:($$state,action)=>{
        return $$state.set("store",action.payload);
    },
    [Actions.MINE_MODIFY_NICKNAME]:($$state,action)=>{
        return $$state.setIn(['user','nickName'],action.payload);
    },
    [Actions.MINE_MODIFY_DISPLAY]:($$state,action)=>{
        return $$state.set("isShowModifyPage",action.payload)
    },
    [Actions.MINE_INFO]:($$state,action)=>{
        return $$state.set('fileurl',action.payload);
    },
    [Actions.DEPARTMENT_lIST]:($$state,action)=>{
        return $$state.set('departments',action.payload);
    }

},$$initialState);
