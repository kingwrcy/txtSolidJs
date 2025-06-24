module.exports = {
  apps: [
    {
      name: 'txtsolidjs-backend',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
        DB_FILE_NAME: 'data.db',
        PORT: 36391,
      }
    }
  ]
};
