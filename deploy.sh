ssh -t root@139.59.92.196 "cd /srv && git pull origin master && PORT=80 REMOTE=http://www.imdbnator.com pm2 restart -f api.js"
