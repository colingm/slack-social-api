FROM node:8

RUN mkdir -p /opt/app
WORKDIR /opt/app
ADD . /opt/app
RUN if [ ! -d /opt/app/node_modules ] ; then cd /opt/app && npm install --quiet; fi
ADD config/config.json /opt/app/config/config.json

EXPOSE 8080

CMD ["npm", "start"]
