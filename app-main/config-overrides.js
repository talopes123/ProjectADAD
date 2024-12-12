module.exports = function override(config, env) {
  if (config.devServer) {
    config.devServer.allowedHosts = 'all'; // Permite todos os hosts
  }
  return config;
};
