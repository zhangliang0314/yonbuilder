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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;

import javax.sql.DataSource;

@Configuration
@ConditionalOnProperty(value = "mdd.dynamicDataSource", havingValue = "false")
public class IMetaDefaultJdbcTemplateConfig {
    @Value("${mapper.url:mapper/**/*Mapper.xml}")
    private String mapUrl;


    @Bean(name="staticJdbcTemplate")
    public JdbcTemplate jdbcTemplate() {
        DataSource dataSource = DataSourceFactory.get(DataSourceFactory.dsPerfix+DataSourceFactory.uimetaDS);
        JdbcTemplate jdbcTemplate = new JdbcTemplate();
        jdbcTemplate.setDataSource(dataSource);
        return jdbcTemplate;
    }

    @Bean(name="jdbcTemplate")
    @Primary
    public DefaultJdbcTemplate defaultJdbcTemplate() {
        DataSource dataSource = DataSourceFactory.get(DataSourceFactory.dsPerfix+DataSourceFactory.bizDS);
        DefaultJdbcTemplate defaultJdbcTemplate = new DefaultJdbcTemplate();
        defaultJdbcTemplate.setDataSource(dataSource);
        return defaultJdbcTemplate;
    }
    /**
     * 替换数据源
     * @return
     */
    @Bean(name = {"mddSqlSessionFactory"})
    @Primary
    public SqlSessionFactory userSqlSessionFactory() {
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

    /**
     * uimeta静态数据源
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
    /**
     * 业务表静态数据源
     * @return
     */
    @Bean(name = {"mddBizSqlSessionFactory"})
    public SqlSessionFactory staticBizSqlSessionFactory() {
        SqlSessionFactoryBean bean = new SqlSessionFactoryBean();
        bean.setDataSource(DataSourceFactory.get(DataSourceFactory.dsPerfix+DataSourceFactory.bizDS));
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
    public SqlSessionTemplate userSqlSessionTemplate(@Qualifier("mddBizSqlSessionFactory") SqlSessionFactory sqlSessionFactory) {
        SqlSessionTemplate template = new SqlSessionTemplate(sqlSessionFactory);
        return template;
    }

    @Bean(name = {"mddRuleSqlSession"})
    public SqlSessionTemplate userSqlSessionTemplate2(@Qualifier("mddStaticSqlSessionFactory") SqlSessionFactory sqlSessionFactory) {
        SqlSessionTemplate template = new SqlSessionTemplate(sqlSessionFactory);
        return template;
    }
    @Bean(name = "mddBizTransactionManager")
    @Primary
    public DataSourceTransactionManager userTransactionManager() {
        DataSource dataSource = DataSourceFactory.get(DataSourceFactory.dsPerfix+DataSourceFactory.bizDS);
        return new DataSourceTransactionManager(dataSource);
    }

}
