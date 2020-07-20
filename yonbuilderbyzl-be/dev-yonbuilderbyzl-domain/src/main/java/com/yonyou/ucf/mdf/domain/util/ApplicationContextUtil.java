package com.yonyou.ucf.mdf.domain.util;

import com.yonyou.ucf.mdd.common.context.MddBaseContext;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public final class ApplicationContextUtil {

    private static final String DEFAULT_ENCODING = "UTF-8";

    /**
     * applicationContext.getbean
     *
     * @param beanName
     * @return
     */
    public static Object getBean(String beanName) {
        return MddBaseContext.getBean(beanName);
    }

    /**
     * applicationContext.getbean
     *
     * @param beanName
     * @param clazz
     * @param <T>
     * @return
     */
    public static <T> T getBean(String beanName, Class<T> clazz) {
        return MddBaseContext.getBean(beanName, clazz);
    }

    /**
     * applicationContext.getbean
     *
     * @param clazz
     * @param <T>
     * @return
     */
    public static <T> T getBean(Class<T> clazz) {
        return MddBaseContext.getBean(clazz);
    }

    /**
     * @param key
     * @param <T>
     * @return
     */
    public static <T> T getThreadContext(String key) {
        return (T) MddBaseContext.getThreadContext(key);
    }

    /**
     * @param key
     * @param value
     */
    public static void setThreadContext(String key, Object value) {
        MddBaseContext.setThreadContext(key, value);
    }

    /**
     * 删除上下文中的key
     *
     * @param key
     */
    public static void delContext(String key) {
        MddBaseContext.delThreadContext(key);
    }

}
