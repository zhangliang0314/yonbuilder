FROM ycr.yonyoucloud.com/base/node:10-alpine
RUN    apk update   \
       &&  apk del git\
       &&  apk add git \
       &&  npm config set unsafe-perm true

WORKDIR /ucf-mdf-fe

ADD ./ucf-mdf-fe /ucf-mdf-fe

RUN  cd /ucf-mdf-fe && ynpm install && npm run build

RUN mkdir -p /yonyoucloud-buildproduct 
RUN cp -r ./ /yonyoucloud-buildproduct/ 

EXPOSE 3003

CMD ["npm start"]