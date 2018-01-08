FROM node:latest
WORKDIR /root/api
COPY . .

RUN npm install -g pm2
RUN npm install
ENV NPM_CONFIG_LOGLEVEL warn

EXPOSE 8081
CMD ["bash"]
