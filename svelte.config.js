import adapter from '@sveltejs/adapter-auto';
import preprocess, { sveltePreprocess } from 'svelte-preprocess';
import { defineConfig } from 'vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: sveltePreprocess(),

  kit: {
    adapter: adapter(),
	alias: {
		'@bugs': 'src/bugs',
      	'@components': 'src/components',
      // Add more aliases as needed
    },
  },

  vite: defineConfig({
    server: {
      fs: {
        allow: ['.'],
      },
    },
    optimizeDeps: {
      exclude: ['fetch-mock']  // Add the dependency you need to exclude
    }
  }),
};

export default config;
