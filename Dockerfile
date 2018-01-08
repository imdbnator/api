FROM node:latest
WORKDIR /root/api
COPY . .

RUN npm install -g pm2
RUN npm install
EXPOSE 8081
