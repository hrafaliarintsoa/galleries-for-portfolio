import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json' assert { type: 'json' }

export default defineConfig({
  build: {
    lib: {
      entry: './src/index.ts',
      name: '@hrafaliarintsoa/galleries-for-portfolio',
      formats: ['es', 'cjs'], // pure ESM package
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        ...Object.keys(pkg.dependencies), // don't bundle dependencies
        /^node:.*/, // don't bundle built-in Node.js modules (use protocol imports!)
      ],
    },
    target: 'esnext', // transpile as little as possible
  },
  plugins: [dts()], // emit TS declaration files
})