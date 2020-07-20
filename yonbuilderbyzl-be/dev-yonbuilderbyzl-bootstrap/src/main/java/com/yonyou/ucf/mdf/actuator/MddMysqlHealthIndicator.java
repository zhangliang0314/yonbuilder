//package com.yonyou.ucf.mdf.actuator;
//
//import com.yonyou.ucf.mdd.conf.DataSourceFactory;
//import com.yonyou.ucf.mdd.common.context.MddBaseContext;
//import org.apache.ibatis.session.SqlSessionFactory;
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//import org.springframework.boot.actuate.health.AbstractHealthIndicator;
//import org.springframework.boot.actuate.health.Health;
//import org.springframework.boot.jdbc.DatabaseDriver;
//import org.springframework.dao.DataAccessException;
//import org.springframework.dao.support.DataAccessUtils;
//import org.springframework.jdbc.IncorrectResultSetColumnCountException;
//import org.springframework.jdbc.core.ConnectionCallback;
//import org.springframework.jdbc.core.JdbcTemplate;
//import org.springframework.jdbc.core.RowMapper;
//import org.springframework.jdbc.support.JdbcUtils;
//import org.springframework.stereotype.Component;
//import org.springframework.util.StringUtils;
//
//import javax.sql.DataSource;
//import java.sql.Connection;
//import java.sql.ResultSet;
//import java.sql.ResultSetMetaData;
//import java.sql.SQLException;
//import java.util.LinkedHashMap;
//import java.util.List;
//import java.util.Map;
//@Component("mdd_mysql")
//public class MddMysqlHealthIndicator extends AbstractHealthIndicator {
//    Logger logger = LoggerFactory.getLogger(MddMysqlHealthIndicator.class);
//
//    private static final String DEFAULT_QUERY = "SELECT 1";
//
//    private String query;
//
//    @Override
//    protected void doHealthCheck(Health.Builder builder) throws Exception {
//        Map<String, Object> details = new LinkedHashMap<>();
//        if(doDataSourceHealthCheck("mddRuleDataSource", DataSourceFactory.get(DataSourceFactory.dsPerfix+DataSourceFactory.ruleDS),details)
//            & doDataSourceHealthCheck("mddUimetaDataSource", DataSourceFactory.get(DataSourceFactory.dsPerfix+DataSourceFactory.uimetaDS),details)
//            & doDataSourceHealthCheck("mddBizDataSource", DataSourceFactory.get(DataSourceFactory.dsPerfix+DataSourceFactory.bizDS),details)){
//            builder.up().withDetails(details);
//        }else{
//            builder.down().withDetails(details);
//        }
//    }
//
//    private boolean doDataSourceHealthCheck(String dataSourceBeanName, DataSource dataSource, Map<String,Object> rstMap) throws Exception {
//        Map<String, Object> detailMap = new LinkedHashMap<>();
//        boolean chkok = true;
//        try {
//            JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
//            String product = jdbcTemplate.execute((ConnectionCallback<String>) this::getProduct);
//            detailMap.put("database", product);
//            String validationQuery = getValidationQuery(product);
//            if (StringUtils.hasText(validationQuery)) {
//                // Avoid calling getObject as it breaks MySQL on Java 7
//                List<Object> results = jdbcTemplate.query(validationQuery,
//                        new SingleColumnRowMapper());
//                Object result = DataAccessUtils.requiredSingleResult(results);
//                detailMap.put("hello", result);
//            }
//        } catch (DataAccessException e) {
//            logger.error("MddMysqlHealthIndicator check datasource " + dataSourceBeanName + " error " + e.getMessage(), e);
//            detailMap.put("error", e.getMessage());
//            chkok = false;
//        }
//        rstMap.put(dataSourceBeanName,detailMap);
//        return chkok;
//    }
//
//    private String getProduct(Connection connection) throws SQLException {
//        return connection.getMetaData().getDatabaseProductName();
//    }
//
//    protected String getValidationQuery(String product) {
//        String query = this.query;
//        if (!StringUtils.hasText(query)) {
//            DatabaseDriver specific = DatabaseDriver.fromProductName(product);
//            query = specific.getValidationQuery();
//        }
//        if (!StringUtils.hasText(query)) {
//            query = DEFAULT_QUERY;
//        }
//        return query;
//    }
//
//    /**
//     * {@link RowMapper} that expects and returns results from a single column.
//     */
//    private static class SingleColumnRowMapper implements RowMapper<Object> {
//
//        @Override
//        public Object mapRow(ResultSet rs, int rowNum) throws SQLException {
//            ResultSetMetaData metaData = rs.getMetaData();
//            int columns = metaData.getColumnCount();
//            if (columns != 1) {
//                throw new IncorrectResultSetColumnCountException(1, columns);
//            }
//            return JdbcUtils.getResultSetValue(rs, 1);
//        }
//
//    }
//}
