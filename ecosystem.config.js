module.exports = {
  apps: [
    {
      name: 'corewatch',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced PM2 options
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Process monitoring
      exec_mode: 'fork',
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Environment variables for system monitoring
      env_vars: {
        COREWATCH_UPDATE_INTERVAL: 60000, // 1 minute
        COREWATCH_MAX_PROCESSES: 50,
        COREWATCH_MAX_CONNECTIONS: 100
      }
    },
    
    // Optional: Development configuration
    {
      name: 'corewatch-dev',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: true,
      watch_delay: 1000,
      ignore_watch: [
        'node_modules',
        'logs',
        '*.log',
        'public/css',
        'public/js'
      ],
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      log_file: './logs/dev-combined.log',
      out_file: './logs/dev-out.log',
      error_file: './logs/dev-error.log'
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'https://github.com/Harleythetech/CoreWatch.git',
      path: '/var/www/corewatch',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};