module.exports = {
  apps: [
    {
      name: 'txtsolidjs-backend',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        DB_FILE_NAME: '/var/www/txtSolidJs/data.db',
        PORT: 36391,
      }
    }
  ]
};
