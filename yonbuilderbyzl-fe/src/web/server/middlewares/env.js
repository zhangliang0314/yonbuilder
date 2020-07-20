const envMiddleware = async (ctx, next) => {
  // 如果需要跳过第一层路径，则需要修改下ctx.routerPath
  const prefix = process.env.PREFIX;
  if (prefix) {
    ctx.routerPath = ctx.path.substr(prefix.length)
  }

  return next();
}

export default envMiddleware
