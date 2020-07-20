package com.yonyou.ucf.mdf.conf;

import com.yonyou.iuap.context.InvocationInfoProxy;
import com.yonyou.iuap.dynamicds.ds.DynamicDataSource;
import com.yonyou.iuap.utils.PropertyUtil;
import org.apache.commons.lang3.StringUtils;

import java.sql.Connection;
import java.sql.SQLException;


/**
 * 重写动态数据源 getCatalog 配置自己的规则
 * @author yangfeng
 */
@SuppressWarnings("all")
public class DynamicDataSourcePrivate extends DynamicDataSource {
    @Override
    protected Connection changeCatalog(Connection con) throws SQLException {
        String catalog = this.getCatalog();
        if (StringUtils.isNotBlank(catalog)) {
            try {
                con.setCatalog(catalog);
            } catch (SQLException var5) {
                LOGGER.error("setting catalog for connection error! tenant catalog is {}", catalog);
                con.close();
                throw var5;
            }

            LOGGER.debug("change catelog for tenant {} success!", catalog);
        } else {
            String msg = "can not get catalog from context, please check tenantid!";
            LOGGER.debug(msg);
            String defaultCatalog = PropertyUtil.getPropertyByKey("jdbc.catalog");
            if (StringUtils.isNotBlank(defaultCatalog) && !defaultCatalog.equals(con.getCatalog())) {
                con.setCatalog(defaultCatalog);
                LOGGER.warn("reset catalog for connection success!");
            }
        }

        return con;
    }

    /**
     * 重写一下 getCatalog方法，配置自己的生成规则
     * @return
     */
    private String getCatalog() {
        String targetCatalog = null;
        //前缀
        String dateNamePrefix = StringUtils.isEmpty(PropertyUtil.getPropertyByKey("jdbc.prefix"))? "" : PropertyUtil.getPropertyByKey("jdbc.prefix");
        String tenantId = StringUtils.isEmpty(InvocationInfoProxy.getTenantid()) ? null : dateNamePrefix+ InvocationInfoProxy.getTenantid();
        if (this.getSchemasProvider() != null && tenantId != null) {
            targetCatalog = this.getSchemasProvider().findSchemasCode(tenantId, InvocationInfoProxy.getSysid());
        } else {
            targetCatalog = tenantId;
        }

        return targetCatalog;
    }
}
