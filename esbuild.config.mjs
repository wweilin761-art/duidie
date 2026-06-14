import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

/** @type {esbuild.BuildOptions} */
const config = {
  entryPoints: ['webview-ui/src/main.ts'],
  bundle: true,
  outfile: 'webview-ui/dist/bundle.js',
  target: 'es2022',
  platform: 'browser',
  format: 'iife',
  sourcemap: true,
  loader: {
    '.css': 'text',
    '.svg': 'text',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(isWatch ? 'development' : 'production'),
  },
  logLevel: 'info',
};

if (isWatch) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log('[esbuild] Watching webview-ui/src for changes...');
} else {
  await esbuild.build(config);
  console.log('[esbuild] Webview bundle built successfully.');
}
