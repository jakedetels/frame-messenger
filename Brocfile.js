const babel = require('broccoli-babel-transpiler');

var tree = babel('lib', {
  modules: 'umd',
  moduleIds: true,
  loose: ['es6.modules']
});

module.exports = tree;
