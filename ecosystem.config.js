module.exports = {
  apps : [{
    name: 'api',
    script: 'src/index.js',
    instances: 1,           // Apenas 1 instância
    exec_mode: 'fork',      // Modo fork (não cluster)
    autorestart: true,
    watch: false,           // Desabilitar watch
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/api-err.log',
    out_file: 'logs/api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z'
  }]
  // Comentar ou remover o 'bot' temporariamente
  // , {
  //   name: 'bot',
  //   script: 'src/bot.js',
  //   instances: 1,
  //   exec_mode: 'fork',
  //   autorestart: true,
  //   watch: false,
  //   env: { NODE_ENV: 'development' },
  //   env_production: { NODE_ENV: 'production' },
  //   error_file: 'logs/bot-err.log',
  //   out_file: 'logs/bot-out.log',
  //   log_date_format: 'YYYY-MM-DD HH:mm Z'
  // }
};