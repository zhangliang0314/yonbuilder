package com.yonyou.ucf.mdf.domain.util;

import com.yonyou.ucf.mdd.common.constant.MddConstants;
import com.yonyou.ucf.mdd.common.context.MddBaseContext;
import com.yonyou.ucf.mdd.common.interfaces.context.ISimpleUser;
import com.yonyou.ucf.mdd.common.interfaces.login.ILoginService;
import lombok.extern.slf4j.Slf4j;
import org.mybatis.spring.SqlSessionTemplate;

@Slf4j
public class CommonUtil {

    public static <T> T getTenantId(){
        T tenantId = ApplicationContextUtil.getThreadContext("tenantId");
        return tenantId;
    }

    public static  <T> void setTenantId(T yhtTenantId) {
        ApplicationContextUtil.setThreadContext("tenantId",yhtTenantId);
    }

    public static String getOrgId(){
        String orgId = ApplicationContextUtil.getThreadContext("getOrgId");
        return orgId;
    }

    public static <T> T getUserId(){
        T userId = ApplicationContextUtil.getThreadContext("userId");
        return userId;
    }

    public static String getToken() {//TODO
        return ApplicationContextUtil.getThreadContext(MddConstants.PARAM_TOKEN);
    }

    public static String getSqlLogLevel() {
        return "DEBUG";
    }

    public static SqlSessionTemplate getCurrentSqlSession() {
        return ApplicationContextUtil.getBean("mainSqlSession",SqlSessionTemplate.class);
    }

    public static ISimpleUser getCurrentUser() {
        ISimpleUser user = null;
        try {
            ILoginService loginService = MddBaseContext.getBean(ILoginService.class);
            if(loginService != null){
                String token = MddBaseContext.getToken();
                user = loginService.getUserByYhtToken(token);
            }
        } catch (Exception e) {
            log.error("通过token 获取user 失败 ： " + e.getMessage(),e);
        }
        return user;
    }

    public static <T> T getTenantByToken(String token) {
        T tenantId = null;
        try {
            ILoginService loginService = MddBaseContext.getBean(ILoginService.class);
            if(loginService != null){
                ISimpleUser user = loginService.getUserByYhtToken(token);
                tenantId = user.getTenantId();
            }
        } catch (Exception e) {
            log.error("通过token 获取user 失败 ： " + e.getMessage(),e);
        }
        return tenantId;
    }

    public static Object getContext(String key) {
        return ApplicationContextUtil.getThreadContext(key);
    }

    public static void setContext(String key, Object object) {
        ApplicationContextUtil.setThreadContext(key, object);
    }

    public static void delContext(String key) {
        ApplicationContextUtil.delContext(key);
    }

    public static void setToken(String yhtAccessToken) {
        ApplicationContextUtil.setThreadContext(MddConstants.PARAM_TOKEN,yhtAccessToken);
    }
}
