FROM node:latest
WORKDIR /usr/src/app
COPY . .

RUN npm install -g pm2
RUN npm install
EXPOSE 8081
CMD ["pm2-runtime", "api.js"]
