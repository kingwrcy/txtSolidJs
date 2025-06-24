cd /root/github/txtSolidJs
git pull

cd backend
npm ci
npm run build
pm2 restart ecosystem.config.cjs

cd ../front
npm ci
npm run build
rm -rf /var/www/cmode/*
cp -r /root/github/txtSolidJs/front/dist/* /var/www/cmode/