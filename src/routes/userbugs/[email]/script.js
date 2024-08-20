import { onMount } from 'svelte';
import { page } from '$app/stores'; // Import the page store
import { get } from 'svelte/store';
import { getAssignedBugsByEmail, getFlaggedBugsByEmail, getRecentCommentedBugsByEmail, getRecentlyClosedBugsByEmail } from '../../../api/api';
import { assignedBugsCache, flaggedBugsCache, commentedBugsCache, closedBugsCache } from '../../../stores/bugStore';
import { writable } from 'svelte/store';

export let assignedBugs = [];
export let flaggedBugs = [];
export let commentedBugs = [];
export let closedBugs = [];
export let error = null;
export let newEmail = writable('');

// Reactive statement to update email based on the page store
let email;
$page.subscribe(($page) => {
    email = $page.params.email;
});

const fetchAndCacheBugs = async (email, cache, fetchFunction) => {
    const cachedData = get(cache)[email];
    if (cachedData) return cachedData;

    try {
        const data = await fetchFunction(email);
        cache.update(cached => ({ ...cached, [email]: data }));
        return data;
    } catch (err) {
        console.error('Failed to fetch bugs:', err);
        error = 'Failed to fetch bugs';
        return [];
    }
};

const fetchBugs = async () => {
    assignedBugs = await fetchAndCacheBugs(email, assignedBugsCache, getAssignedBugsByEmail);
    flaggedBugs = await fetchAndCacheBugs(email, flaggedBugsCache, getFlaggedBugsByEmail);
    commentedBugs = await fetchAndCacheBugs(email, commentedBugsCache, getRecentCommentedBugsByEmail);
    closedBugs = await fetchAndCacheBugs(email, closedBugsCache, getRecentlyClosedBugsByEmail);
    error = null;
};

export const handleEmailChange = () => {
    let emailValue = get(newEmail).trim();
    if (emailValue && !emailValue.includes('@')) {
        emailValue += "@mozilla.com";
    }
    if (emailValue !== email) {
        email = emailValue;
        fetchBugs();
    }
};

onMount(() => {
    fetchBugs();
});
