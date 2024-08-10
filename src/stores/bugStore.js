import { writable } from 'svelte/store';

export const bugCache = writable([]);

export const whiteboardBugCache = writable([]);

export const assignedBugsCache = writable([]);
export const flaggedBugsCache = writable([]);
export const commentedBugsCache = writable([]);
export const closedBugsCache = writable([]);