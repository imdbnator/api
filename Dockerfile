FROM node:latest
WORKDIR /root/api
COPY . .

ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install -g pm2
RUN npm install
EXPOSE 8081
