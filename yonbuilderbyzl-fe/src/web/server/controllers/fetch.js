
const fetchController = {
  fetch: function (ctx) {
    const interMode = ctx.cookies.get('interMode');
    const { mode } = ctx.query;
    let redirectUrl = null;
    if (!interMode && mode) {
      ctx.cookies.set('interMode', mode, {
        path: '/',
        expires: new Date(Date.now() + 24 * 3600 * 1000),
        httpOnly: true
      });
      redirectUrl = mode === 'pc' ? '/portal' : '/billing'
    }
    ctx.body = {
      code: 200,
      data: { redirectUrl },
      message: '测试成功'
    };
  }
}
module.exports = fetchController;
