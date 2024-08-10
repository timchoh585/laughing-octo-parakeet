import { writable } from 'svelte/store';

export const routeParams = writable({
  productName: '',
  componentName: ''
});
