import { config } from 'dotenv';
config(); // loads .env

export default {
  apps: [
    {
      name: 'qr-scanner-server',
      script: './server/index.js',
      cwd: './',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
    },
  ],
};
