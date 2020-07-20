const env = {
  // eslint-disable-next-line no-undef
  HTTP_SCRIPT_BASEURL: `http://${localPath}:${process.env.SCRIPT_PORT || 3004}/static`,
  HTTP_SCRIPT_SUFFIX: '',
  STATIC_RANDOM_SUFFIX: Math.random()
}
export default env
