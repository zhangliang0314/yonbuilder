package com.yonyou.ucf.mdf.conf;

import com.yonyou.ucf.mdd.conf.DataSourceFactory;
import org.apache.ibatis.session.SqlSessionFactory;
import org.imeta.spring.support.db.DefaultJdbcTemplate;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * 替换mdf数据源
 * edit : yangfeng
 */
@Configuration
@SuppressWarnings("all")
@ConditionalOnProperty(value = "mdd.dynamicDataSource", havingValue = "true")
public class IMetaDynSqlSessionTemplateConfig {

    @Value("${mapper.url:mapper/**/*Mapper.xml}")
    private String mapUrl;
    /**
     * 替换数据源
     * @param dataSource
     * @return
     */
    @Bean(name = {"mddSqlSessionFactory"})
    @Primary
    public SqlSessionFactory userSqlSessionFactory(DynamicDataSourcePrivate dataSource) {
        SqlSessionFactoryBean bean = new SqlSessionFactoryBean();
        bean.setDataSource(dataSource);
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        try {
            bean.setMapperLocations(resolver.getResources("classpath*:"+mapUrl));
            return bean.getObject();
        } catch (Exception var5) {
            throw new RuntimeException(var5);
        }
    }

    /**
     * 静态数据源
     * @param dataSource
     * @return
     */
    @Bean(name = {"mddStaticSqlSessionFactory"})
    public SqlSessionFactory staticUserSqlSessionFactory() {
        SqlSessionFactoryBean bean = new SqlSessionFactoryBean();
        bean.setDataSource(DataSourceFactory.get(DataSourceFactory.dsPerfix+DataSourceFactory.uimetaDS));
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        try {
            bean.setMapperLocations(resolver.getResources("classpath*:"+mapUrl));
            return bean.getObject();
        } catch (Exception var5) {
            throw new RuntimeException(var5);
        }
    }
    @Bean(name = {"mddUimetaSqlSession"})
    public SqlSessionTemplate userSqlSessionTemplate1(@Qualifier("mddStaticSqlSessionFactory") SqlSessionFactory sqlSessionFactory) {
        SqlSessionTemplate template = new SqlSessionTemplate(sqlSessionFactory);
        return template;
    }

    @Bean(name = {"sqlSession"})
    public SqlSessionTemplate sqlSession(@Qualifier("mddStaticSqlSessionFactory") SqlSessionFactory sqlSessionFactory) {
        SqlSessionTemplate template = new SqlSessionTemplate(sqlSessionFactory);
        return template;
    }

    @Bean( name = {"mddBizSqlSession"})
    public SqlSessionTemplate userSqlSessionTemplate(@Qualifier("mddSqlSessionFactory") SqlSessionFactory sqlSessionFactory) {
        SqlSessionTemplate template = new SqlSessionTemplate(sqlSessionFactory);
        return template;
    }

    @Bean(name = {"mddRuleSqlSession"})
    public SqlSessionTemplate userSqlSessionTemplate2(@Qualifier("mddStaticSqlSessionFactory") SqlSessionFactory sqlSessionFactory) {
        SqlSessionTemplate template = new SqlSessionTemplate(sqlSessionFactory);
        return template;
    }
    @Bean(name = "mddBizTransactionManager")
    public DataSourceTransactionManager userTransactionManager(DynamicDataSourcePrivate dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }

    /**
     * billcode 使用
     */
    @Bean
    @Primary
    public PlatformTransactionManager defaultTransactionManager(DynamicDataSourcePrivate dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }

    @Bean(name = "staticJdbcTemplate")
    public DefaultJdbcTemplate staticJdbcTemplate() {
        DefaultJdbcTemplate defaultJdbcTemplate = new DefaultJdbcTemplate();
        defaultJdbcTemplate.setDataSource(DataSourceFactory.get(DataSourceFactory.dsPerfix+DataSourceFactory.uimetaDS));
        return defaultJdbcTemplate;
    }
}
