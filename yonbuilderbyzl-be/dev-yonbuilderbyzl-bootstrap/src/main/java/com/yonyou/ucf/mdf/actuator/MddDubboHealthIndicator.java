//package com.yonyou.ucf.mdf.actuator;
//
//import com.yonyou.ucf.mdd.common.constant.MddConstants;
//import com.yonyou.ucf.mdd.utils.dubbo.DubboUtils;
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//import org.springframework.boot.actuate.health.AbstractHealthIndicator;
//import org.springframework.boot.actuate.health.Health;
//import org.springframework.core.io.Resource;
//import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
//import org.springframework.core.io.support.ResourcePatternResolver;
//import org.springframework.stereotype.Component;
//
//import java.util.LinkedHashMap;
//import java.util.Map;
//
//@Component("mdd_dubbo")
//public class MddDubboHealthIndicator extends AbstractHealthIndicator {
//    Logger logger = LoggerFactory.getLogger(MddDubboHealthIndicator.class);
//
//    @Override
//    protected void doHealthCheck(Health.Builder builder) throws Exception {
//        ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
//        Resource resource = resolver.getResource(MddConstants.DUBBO_CONFIG_FILE);
//        if(!resource.exists()) {
//            logger.debug("Dubbo配置文件 " + MddConstants.DUBBO_CONFIG_FILE + " 未加载。");
//            builder.unknown().withDetail("info","配置未加载");
//            return;
//        }
//        Map<String, Object> details = new LinkedHashMap<>();
//        //TODO 修改group ; 增删其他远程接口
//        builder.up().withDetails(details);
////        if(doDubboHealthCheck(details, IBillQueryService.class,"test",null)
////                & doDubboHealthCheck(details, IUIMetaQueryService.class, "test",null)){
////            builder.up().withDetails(details);
////        }else{
////            builder.down().withDetails(details);
////        }
//    }
//
//    private <T> boolean doDubboHealthCheck(Map<String,Object> rstMap,Class<T> clz, String group, String version){
//        return doDubboHealthCheck(rstMap, clz,group,version,null);
//    }
//
//    private <T> boolean doDubboHealthCheck(Map<String,Object> rstMap,Class<T> clz, String group, String version, Integer timeout) {
//        Map<String, Object> detailMap = new LinkedHashMap<>();
//        detailMap.put("serviceClz", clz.getName());
//        detailMap.put("group", group);
//        detailMap.put("version", version);
//        boolean chkok = true;
//        try {
//            T rmService = DubboUtils.getDubboService(clz,group,version, timeout);
//            if(rmService != null){
//                detailMap.put("state", "success");
//            }
//        } catch (Exception e) {
//            logger.error("MddDubboHealthIndicator check service " + clz.getName() + " error " + e.getMessage(), e);
//            detailMap.put("state", "fail");
//            detailMap.put("error", e.getMessage());
//            chkok = false;
//        }
//        rstMap.put(clz.getName(),detailMap);
//        return chkok;
//    }
//}
