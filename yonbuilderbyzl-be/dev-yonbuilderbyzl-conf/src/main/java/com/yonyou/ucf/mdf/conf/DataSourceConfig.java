package com.yonyou.ucf.mdf.conf;

import org.apache.tomcat.jdbc.pool.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

/**
 * 数据库配置属性文件
 * edit by yangfeng
 */
@Configuration
@PropertySource("classpath:tenant-db.properties")
public class DataSourceConfig {
    /**
     * 数据源配置, 使用Tomcat JDBC连接池
     * @return
     */
    @Bean(destroyMethod = "close",name = "jdbcDataSource")
    public DataSource jdbcDataSource (DataSourceConfig dataSourceConfig){
        DataSource dataSource  = new DataSource();
        //连接基本信息
        dataSource.setDriverClassName(dataSourceConfig.getJdbcDriver());
        dataSource.setUrl(dataSourceConfig.getJdbcUrl());
        dataSource.setUsername(dataSourceConfig.getJdbcUsername());
        dataSource.setPassword(dataSourceConfig.getJdbcPassword());
        dataSource.setDefaultCatalog(dataSourceConfig.getJdbcCatalog());
        //连接池
        dataSource.setMaxActive(Integer.parseInt(dataSourceConfig.getJdbcPoolMaxActive()));
        dataSource.setMaxIdle(Integer.parseInt(dataSourceConfig.getJdbcPoolMaxIdle()));
        dataSource.setMinIdle(Integer.parseInt(dataSourceConfig.getJdbcPoolMinIdle()));
        dataSource.setMaxWait(Integer.parseInt(dataSourceConfig.getJdbcPoolMaxWait()));
        dataSource.setInitialSize(Integer.parseInt(dataSourceConfig.getJdbcPoolInitialSize()));

        dataSource.setTestOnBorrow(Boolean.parseBoolean(dataSourceConfig.getJdbcPoolTestOnBorrow()));
        dataSource.setValidationQuery(dataSourceConfig.getJdbcPoolValidationQuery());
        dataSource.setValidationInterval(Long.parseLong(dataSourceConfig.getJdbcPoolValidationInterval()));
        dataSource.setTestOnReturn(Boolean.parseBoolean(dataSourceConfig.getJdbcPoolTestOnReturn()));

        dataSource.setTestWhileIdle(Boolean.parseBoolean(dataSourceConfig.getJdbcPoolTestWhileIdle()));
        dataSource.setTimeBetweenEvictionRunsMillis(Integer.parseInt(dataSourceConfig.getJdbcPoolTimeBetweenEvictionRunsMillis()));
        dataSource.setNumTestsPerEvictionRun(Integer.parseInt(dataSourceConfig.getJdbcPoolNumTestsPerEvictionRun()));

        dataSource.setMinEvictableIdleTimeMillis(Integer.parseInt(dataSourceConfig.getJdbcPoolMinEvictableIdleTimeMillis()));
        dataSource.setRemoveAbandoned(Boolean.parseBoolean(dataSourceConfig.getJdbcPoolRemoveAbandoned()));
        dataSource.setRemoveAbandonedTimeout(Integer.parseInt(dataSourceConfig.getJdbcPoolRemoveAbandonedTimeout()));

        return dataSource;
    }

    @Value("${jdbc.driver}")
    private String jdbcDriver;
    @Value("${jdbc.url}")
    private String jdbcUrl;
    @Value("${jdbc.username}")
    private String jdbcUsername;
    @Value("${jdbc.password}")
    private String jdbcPassword;
    @Value("${jdbc.defaultAutoCommit}")
    private String jdbcDefaultAutoCommit;
    @Value("${jdbc.catalog}")
    private String jdbcCatalog;

    @Value("${jdbc.pool.minIdle}")
    private String jdbcPoolMinIdle;
    @Value("${jdbc.pool.maxIdle}")
    private String jdbcPoolMaxIdle;
    @Value("${jdbc.pool.maxActive}")
    private String jdbcPoolMaxActive;
    @Value("${jdbc.pool.maxWait}")
    private String jdbcPoolMaxWait;
    @Value("${jdbc.pool.initialSize}")
    private String jdbcPoolInitialSize;

    @Value("${jdbc.pool.testOnBorrow}")
    private String jdbcPoolTestOnBorrow;
    @Value("${jdbc.pool.validationInterval}")
    private String jdbcPoolValidationInterval;
    @Value("${jdbc.pool.testOnReturn}")
    private String jdbcPoolTestOnReturn;
    @Value("${jdbc.pool.validationQuery}")
    private String jdbcPoolValidationQuery;

    @Value("${jdbc.pool.testWhileIdle}")
    private String jdbcPoolTestWhileIdle;
    @Value("${jdbc.pool.timeBetweenEvictionRunsMillis}")
    private String jdbcPoolTimeBetweenEvictionRunsMillis;
    @Value("${jdbc.pool.numTestsPerEvictionRun}")
    private String jdbcPoolNumTestsPerEvictionRun;

    @Value("${jdbc.pool.minEvictableIdleTimeMillis}")
    private String jdbcPoolMinEvictableIdleTimeMillis;
    @Value("${jdbc.pool.removeAbandoned}")
    private String jdbcPoolRemoveAbandoned;

    public String getJdbcCatalog() {
        return jdbcCatalog;
    }

    public void setJdbcCatalog(String jdbcCatalog) {
        this.jdbcCatalog = jdbcCatalog;
    }

    @Value("${jdbc.pool.removeAbandonedTimeout}")
    private String jdbcPoolRemoveAbandonedTimeout;

    public String getJdbcDriver() {
        return jdbcDriver;
    }

    public void setJdbcDriver(String jdbcDriver) {
        this.jdbcDriver = jdbcDriver;
    }

    public String getJdbcUrl() {
        return jdbcUrl;
    }

    public void setJdbcUrl(String jdbcUrl) {
        this.jdbcUrl = jdbcUrl;
    }

    public String getJdbcUsername() {
        return jdbcUsername;
    }

    public void setJdbcUsername(String jdbcUsername) {
        this.jdbcUsername = jdbcUsername;
    }

    public String getJdbcPassword() {
        return jdbcPassword;
    }

    public void setJdbcPassword(String jdbcPassword) {
        this.jdbcPassword = jdbcPassword;
    }

    public String getJdbcDefaultAutoCommit() {
        return jdbcDefaultAutoCommit;
    }

    public void setJdbcDefaultAutoCommit(String jdbcDefaultAutoCommit) {
        this.jdbcDefaultAutoCommit = jdbcDefaultAutoCommit;
    }

    public String getJdbcPoolMinIdle() {
        return jdbcPoolMinIdle;
    }

    public void setJdbcPoolMinIdle(String jdbcPoolMinIdle) {
        this.jdbcPoolMinIdle = jdbcPoolMinIdle;
    }

    public String getJdbcPoolMaxIdle() {
        return jdbcPoolMaxIdle;
    }

    public void setJdbcPoolMaxIdle(String jdbcPoolMaxIdle) {
        this.jdbcPoolMaxIdle = jdbcPoolMaxIdle;
    }

    public String getJdbcPoolMaxActive() {
        return jdbcPoolMaxActive;
    }

    public void setJdbcPoolMaxActive(String jdbcPoolMaxActive) {
        this.jdbcPoolMaxActive = jdbcPoolMaxActive;
    }

    public String getJdbcPoolMaxWait() {
        return jdbcPoolMaxWait;
    }

    public void setJdbcPoolMaxWait(String jdbcPoolMaxWait) {
        this.jdbcPoolMaxWait = jdbcPoolMaxWait;
    }

    public String getJdbcPoolInitialSize() {
        return jdbcPoolInitialSize;
    }

    public void setJdbcPoolInitialSize(String jdbcPoolInitialSize) {
        this.jdbcPoolInitialSize = jdbcPoolInitialSize;
    }

    public String getJdbcPoolTestOnBorrow() {
        return jdbcPoolTestOnBorrow;
    }

    public void setJdbcPoolTestOnBorrow(String jdbcPoolTestOnBorrow) {
        this.jdbcPoolTestOnBorrow = jdbcPoolTestOnBorrow;
    }

    public String getJdbcPoolValidationInterval() {
        return jdbcPoolValidationInterval;
    }

    public void setJdbcPoolValidationInterval(String jdbcPoolValidationInterval) {
        this.jdbcPoolValidationInterval = jdbcPoolValidationInterval;
    }

    public String getJdbcPoolTestOnReturn() {
        return jdbcPoolTestOnReturn;
    }

    public void setJdbcPoolTestOnReturn(String jdbcPoolTestOnReturn) {
        this.jdbcPoolTestOnReturn = jdbcPoolTestOnReturn;
    }

    public String getJdbcPoolValidationQuery() {
        return jdbcPoolValidationQuery;
    }

    public void setJdbcPoolValidationQuery(String jdbcPoolValidationQuery) {
        this.jdbcPoolValidationQuery = jdbcPoolValidationQuery;
    }

    public String getJdbcPoolTestWhileIdle() {
        return jdbcPoolTestWhileIdle;
    }

    public void setJdbcPoolTestWhileIdle(String jdbcPoolTestWhileIdle) {
        this.jdbcPoolTestWhileIdle = jdbcPoolTestWhileIdle;
    }

    public String getJdbcPoolTimeBetweenEvictionRunsMillis() {
        return jdbcPoolTimeBetweenEvictionRunsMillis;
    }

    public void setJdbcPoolTimeBetweenEvictionRunsMillis(String jdbcPoolTimeBetweenEvictionRunsMillis) {
        this.jdbcPoolTimeBetweenEvictionRunsMillis = jdbcPoolTimeBetweenEvictionRunsMillis;
    }

    public String getJdbcPoolNumTestsPerEvictionRun() {
        return jdbcPoolNumTestsPerEvictionRun;
    }

    public void setJdbcPoolNumTestsPerEvictionRun(String jdbcPoolNumTestsPerEvictionRun) {
        this.jdbcPoolNumTestsPerEvictionRun = jdbcPoolNumTestsPerEvictionRun;
    }

    public String getJdbcPoolMinEvictableIdleTimeMillis() {
        return jdbcPoolMinEvictableIdleTimeMillis;
    }

    public void setJdbcPoolMinEvictableIdleTimeMillis(String jdbcPoolMinEvictableIdleTimeMillis) {
        this.jdbcPoolMinEvictableIdleTimeMillis = jdbcPoolMinEvictableIdleTimeMillis;
    }

    public String getJdbcPoolRemoveAbandoned() {
        return jdbcPoolRemoveAbandoned;
    }

    public void setJdbcPoolRemoveAbandoned(String jdbcPoolRemoveAbandoned) {
        this.jdbcPoolRemoveAbandoned = jdbcPoolRemoveAbandoned;
    }

    public String getJdbcPoolRemoveAbandonedTimeout() {
        return jdbcPoolRemoveAbandonedTimeout;
    }

    public void setJdbcPoolRemoveAbandonedTimeout(String jdbcPoolRemoveAbandonedTimeout) {
        this.jdbcPoolRemoveAbandonedTimeout = jdbcPoolRemoveAbandonedTimeout;
    }



}
