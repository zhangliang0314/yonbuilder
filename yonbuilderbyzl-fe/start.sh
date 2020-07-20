#! bin/sh
export NODE_ENV="production"
export PREFIX="/developplatform"
cd $(dirname $0)
pwd
node bin.js
