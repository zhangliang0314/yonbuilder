package com.yonyou.ucf.mdf.app.controller;

import com.yonyou.iuap.context.InvocationInfoProxy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import javax.sql.DataSource;
import java.sql.PreparedStatement;
import java.util.HashMap;
import java.util.Map;

/**
 * 动态建立租户表
 */
@RestController
@RequestMapping(value = "/tenant")
public class DynamicCreateTable {
    private static Logger log = LoggerFactory.getLogger(DynamicCreateTable.class);

    @Autowired
    private DataSource dynamicDataSource;

    @RequestMapping(value = "/createTable", method = RequestMethod.POST)
    public Object init(HttpServletRequest request, @RequestBody Map<String, Object> params) {
        String tenantId = (String) params.get("tenantId");
        String sql = (String) params.get("sql");
        log.info("租户信息 tenantId：" + tenantId + ", 建表语句sql: " + sql);

        try (PreparedStatement executor = dynamicDataSource.getConnection().prepareStatement(sql)){
            // 设置租户ID的上下文
            InvocationInfoProxy.setTenantid(tenantId);
            // 执行建表
            executor.execute();

            Map<String, Object> result = new HashMap<String, Object>();
            result.put("status", 1);
            result.put("msg", "建表成功");
            return result;
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            Map<String, Object> result = new HashMap<String, Object>();
            result.put("status", 0);
            result.put("msg", "建表失败");
            return result;
        }
    }
}
