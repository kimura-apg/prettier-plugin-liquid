const moduleAlias = require('module-alias');
const path = require('path');

const prettierMajor = process.env.PRETTIER_MAJOR;
// Standalone project: use local node_modules (2 levels up from src/test/)
const prettierPath =
  prettierMajor === '3'
    ? path.join(__dirname, '..', '..', 'node_modules', 'prettier3')
    : path.join(__dirname, '..', '..', 'node_modules', 'prettier2');

module.exports = async function setup() {
  moduleAlias.addAlias('prettier', prettierPath);
  console.error('====================================');
  console.error(`Prettier version: ${require('prettier').version}`);
  console.error('====================================');
};
