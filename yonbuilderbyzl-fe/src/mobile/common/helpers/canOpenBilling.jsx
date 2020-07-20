import { proxy, uniformProxy, combine } from '@mdf/cube/lib/helpers/util';

export function judge (user, ctx, baseUrl) {
  return process.env.__CLIENT__ ? clientJudge(user) : serverJudge(user, ctx, baseUrl);
}

const clientJudge = async function (user) {
  const { storeId, userStores } = user;
  if (!storeId || !userStores.length) {
    cb.utils.alert('未登录到门店，不能开单', 'error');
    return false;
  }
  // return true;
  const config = {
    url: 'billTemplateSet/getEnterRetailAuth',
    method: 'GET'
  };
  const json = await proxy(config);
  if (json.code !== 200) {
    cb.utils.alert(json.message, 'error');
    return false;
  }
  return true;
}

const serverJudge = async function (user, ctx, baseUrl) {
  const { storeId, userStores } = user;
  if (!storeId || !userStores.length) {
    ctx.logger.error('零售开单校验失败：未登录到门店，不能开单');
    ctx.body = '未登录到门店，不能开单';
    return false;
  }
  const url = combine(baseUrl, `billTemplateSet/getEnterRetailAuth?token=${ctx.token}`);
  const config = {
    url,
    method: 'GET'
  };
  const json = await uniformProxy(config);
  if (json.code !== 200) {
    ctx.logger.error(`零售开单校验失败：【接口】${url} 【异常】${json.message}`);
    ctx.body = json;
    return false;
  }
  return true;
}
