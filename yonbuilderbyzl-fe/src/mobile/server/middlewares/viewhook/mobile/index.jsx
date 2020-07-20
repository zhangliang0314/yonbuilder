import html from './html'

export default function viewhook () {
  return async function (ctx, next) {
    ctx.render = function () {
      ctx.type = 'html';
      ctx.body = html()
    }

    await next()
  }
}
