module.exports = function (api) {
  api.cache(true);

  const presets = [
    ['babel-preset-expo', { targets: { node: 'current' } }],
    ['@babel/preset-react', { targets: { node: 'current' } }]
  ];
  const plugins = ['@babel/plugin-syntax-jsx']
  
  return {
    presets,
    plugins
  };
};
