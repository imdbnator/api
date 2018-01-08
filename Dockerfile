FROM node:latest
WORKDIR /usr/src/api
RUN npm install -g pm2
RUN npm install
EXPOSE 8081
CMD ["pm2", "restart", "-f", "api.js"]
