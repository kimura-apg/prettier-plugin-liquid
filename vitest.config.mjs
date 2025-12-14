import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const prettierMajor = process.env.PRETTIER_MAJOR;
const prettierAlias =
  prettierMajor === '3'
    ? path.join(__dirname, 'node_modules', 'prettier3')
    : path.join(__dirname, 'node_modules', 'prettier2');

export default defineConfig({
  resolve: {
    alias: {
      prettier: prettierAlias,
    },
  },
  test: {
    include: ['src/test/**/*.spec.ts'],
    exclude: [...configDefaults.exclude],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true,
      },
    },
    globalSetup: ['./src/test/test-setup.js'],
    // liquid-html-parserはnode_modulesから読み込むため、setupFilesは不要
  },
});
