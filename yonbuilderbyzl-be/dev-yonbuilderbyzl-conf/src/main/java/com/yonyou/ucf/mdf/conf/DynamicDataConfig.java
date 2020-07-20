package com.yonyou.ucf.mdf.conf;

import com.yonyou.iuap.dynamicds.ds.DefaultDataSourceProvider;
import com.yonyou.ucf.mdd.conf.DataSourceFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * 配制动态数据源
 * @author yangfeng
 */
@Configuration
public class DynamicDataConfig{
    @Value("${mdd.dynamicDataSource}")
    String dynamicFlag;
    /**
     * 配置动态数据源
     * @return
     */
    @Bean(name = "dynamicDataSource")
    public DataSource dynamicDataSource (DataSource jdbcDataSource, DefaultDataSourceProvider dsProvider){
        //为保证使用DynamicDataSourcePrivate实例的兼容性,这里初始化的实例会根据参数调整
        if ("false".equalsIgnoreCase(dynamicFlag)){
            DataSource dataSource = DataSourceFactory.get(DataSourceFactory.dsPerfix+DataSourceFactory.bizDS);
            return dataSource;
        }
        DynamicDataSourcePrivate dynamicDataSource = new DynamicDataSourcePrivate();
        Map<Object,Object> map = new HashMap<>();
        map.put("jdbcDataSource",jdbcDataSource);
        dynamicDataSource.setTargetDataSources(map);
        dynamicDataSource.setDefaultTargetDataSource(jdbcDataSource);
        dynamicDataSource.setDsProvider(dsProvider);
        return dynamicDataSource;
    }

    @Bean
    public DefaultDataSourceProvider dsProvider(){
        return new DefaultDataSourceProvider();
    }
}
