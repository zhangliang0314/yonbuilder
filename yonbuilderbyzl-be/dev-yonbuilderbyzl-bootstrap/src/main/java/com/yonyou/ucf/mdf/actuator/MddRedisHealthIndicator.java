//package com.yonyou.ucf.mdf.actuator;
//
//import com.yonyou.ucf.mdd.redis.factory.DaoFactory;
//import com.yonyou.ucf.mdd.redis.interfaces.IRedisDao;
//import com.yonyou.ucf.mdd.rule.load.RuleSDKContext;
//import com.yonyou.ucf.mdd.uimeta.load.UIMetaSDKContext;
//import org.springframework.boot.actuate.health.AbstractHealthIndicator;
//import org.springframework.boot.actuate.health.Health;
//import org.springframework.stereotype.Component;
//
//@Component("mdd_redis")
//public class MddRedisHealthIndicator extends AbstractHealthIndicator {
//
//    private final String TEST_KEY = "MddRedisHealthIndicator";
//    private final String TEST_VALUE = "OK";
//    @Override
//    protected void doHealthCheck(Health.Builder builder) throws Exception {
//        //更换redis 实现方式，这里需要重新实现
//        if(RuleSDKContext.getRuleConfProps().isRedisCache() || UIMetaSDKContext.getUIMetaConfProps().isRedisCache()){
//            IRedisDao daoImpl = DaoFactory.getDao();
//            if(null == daoImpl){
//                builder.down().withDetail("error","Error 未能获取连接");
//            }
//            daoImpl.setString(TEST_KEY,TEST_VALUE,1000);
//            String value = daoImpl.getValue(TEST_KEY);
//            if(null != value && TEST_VALUE.equals(value))
//                builder.up().withDetail("test",value);
//            else
//                builder.unknown().withDetail("test", value==null?"null":value);
//        }else{
//            builder.unknown().withDetail("message", "未配置MDD使用redis缓存");
//        }
//    }
//}
