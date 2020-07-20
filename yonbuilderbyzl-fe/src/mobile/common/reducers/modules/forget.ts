import Immutable from 'node_modules0/immutable'

import { genAction, genFetchOptions, toJSON, proxy } from 'node_modules0/@mdf/cube/lib/helpers/util'

const $$initialState = Immutable.fromJS({
    currentKey: 'Forgot',
    phone: '',
    validateCode: '',
    newPassword: '',
    oldPassword: '',
    disabled_code: true,
    disabled_button: true,
    validPhone: false,
    wait: 60,
    text: '获取验证码',
    checkSmsCode: true,
    errCheckMsg: '',
});

export default ($$state = $$initialState, action) => {
    switch (action.type) {
        case 'FORGOT_COMMON_SET_DATA':
            return $$state.merge(action.payload);
        default:
            return $$state;
    }
}

export function setData(key) {
    return function (dispatch) {
        dispatch(genAction('FORGOT_COMMON_SET_DATA', key));
    }
}

/*获取验证码*/
export function getValidateCode(val) {
    return function (dispatch, getState) {
        const config = {
            url: '/user/smscode.do',
            method: 'POST',
            params: { phone: val.phone }
        };
        proxy(config)
            .then(function (json) {
                if (json.code !== 200) {
                    val.err(json);
                } else {
                    val.success(json);
                }
            })
    }
}
/*校验验证码*/
export function checkValidateCode(val) {
    return function (dispatch, getState) {
        //val = {phone:'',smsCode}
        const config = {
            url: 'user/checksmscode.do',
            method: 'POST',
            options: { token: false },
            params: val.params
        };
        proxy(config)
            .then(function (json) {
                if (json.code !== 200) {
                    val.err(json);
                } else {
                    val.success(json);
                }
            })
    }
}
/*重置密码*/
export function changePassword(val) {
    return function (dispatch, getState) {
        const config = {
            url: 'user/resetpwd.do',
            method: 'POST',
            params: val.params
        };
        proxy(config)
            .then(function (json) {
                if (json.code !== 200) {
                    val.err(json);
                } else {
                    val.success(json);
                }

            })
    }
}
/*修改密码*/
export function modifyPassword(val) {
    return function (dispatch, getState) {
        const config = {
            url: 'user/modifypwd.do',
            method: 'POST',
            params: val.params
        };
        proxy(config)
            .then(function (json) {
                if (json.code !== 200) {
                    val.err(json);
                } else {
                    val.success(json);
                }
            })
    }
}
