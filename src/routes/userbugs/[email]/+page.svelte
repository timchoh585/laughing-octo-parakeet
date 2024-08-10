<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';
    import { getAssignedBugsByEmail, getFlaggedBugsByEmail, getRecentCommentedBugsByEmail, getRecentlyClosedBugsByEmail } from '../../../api/api';
    import { assignedBugsCache, flaggedBugsCache, commentedBugsCache, closedBugsCache } from '../../../stores/bugStore';
    import { writable } from 'svelte/store';
  
    let assignedBugs = [];
    let flaggedBugs = [];
    let commentedBugs = [];
    let closedBugs = [];
    let error = null;
    let newEmail = writable('');
  
    $: email = $page.params.email;
  
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
  
    const handleEmailChange = () => {
      let emailValue = $newEmail.trim();
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
  </script>
  
  <style>
    .container {
      padding: 2rem;
      background: #fff;
      border-radius: 8px;
      max-width: 1200px;
      margin: 2rem auto;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #333;
      text-align: center;
      margin-bottom: 2rem;
    }
    .error {
      color: red;
      margin-bottom: 1rem;
      text-align: center;
    }
    .email-search {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }
    .email-search input {
      padding: 0.5rem;
      margin-right: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    .email-search button {
      padding: 0.5rem 1rem;
      background: #007bff;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    .email-search button:hover {
      background: #0056b3;
    }
    .section {
      margin-bottom: 2rem;
    }
    .bug-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      list-style: none;
      padding: 0;
    }
    .bug-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1rem;
      background-color: #f9f9f9;
    }
    .bug-item h2 {
      margin: 0;
      font-size: 1.2rem;
    }
    .bug-item p {
      margin: 0.5rem 0;
    }
    .bug-item .details {
      font-size: 0.9rem;
      color: #555;
    }
    .bug-item a {
      text-decoration: none;
      color: #007bff;
    }
    .bug-item a:hover {
      text-decoration: underline;
    }
    .section-title {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #333;
    }
    .no-bugs {
      color: #888;
    }
  </style>
  
  <div class="container">
    {#if error}
      <p class="error">{error}</p>
    {/if}
  
    <h1>Bug List for {email}</h1>
  
    <div class="email-search">
      <input type="text" bind:value={$newEmail} placeholder="Enter another email" />
      <button on:click={handleEmailChange}>Search</button>
    </div>
  
    <div class="section">
      <h2 class="section-title">Assigned Bugs</h2>
      {#if assignedBugs.length > 0}
        <ul class="bug-list">
          {#each assignedBugs as bug}
            <li class="bug-item">
              <h2><a href={`/bugs/${bug.id}`}>{bug.summary}</a></h2>
              <p><strong>Status:</strong> {bug.status} <strong>Resolution:</strong> {bug.resolution}</p>
              <p class="details">
                <strong>ID:</strong> {bug.id} |
                <strong>Type:</strong> {bug.type} |
                <strong>Severity:</strong> {bug.severity} |
                <strong>Priority:</strong> {bug.priority}
              </p>
              {#if bug.assigned_to_detail}
                <p class="details">
                  <strong>Assigned to:</strong> {bug.assigned_to_detail.real_name} ({bug.assigned_to_detail.email})
                </p>
              {/if}
              {#if bug.creator_detail}
                <p class="details">
                  <strong>Creator:</strong> {bug.creator_detail.real_name} ({bug.creator_detail.email})
                </p>
              {/if}
              <p class="details">
                <strong>Created on:</strong> {new Date(bug.creation_time).toLocaleDateString()} |
                <strong>Last modified:</strong> {new Date(bug.last_change_time).toLocaleDateString()}
              </p>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="no-bugs">No assigned bugs found.</p>
      {/if}
    </div>
  
    <div class="section">
      <h2 class="section-title">Flagged Bugs</h2>
      {#if flaggedBugs.length > 0}
        <ul class="bug-list">
          {#each flaggedBugs as bug}
            <li class="bug-item">
              <h2><a href={`/bugs/${bug.id}`}>{bug.summary}</a></h2>
              <p><strong>Status:</strong> {bug.status} <strong>Resolution:</strong> {bug.resolution}</p>
              <p class="details">
                <strong>ID:</strong> {bug.id} |
                <strong>Type:</strong> {bug.type} |
                <strong>Severity:</strong> {bug.severity} |
                <strong>Priority:</strong> {bug.priority}
              </p>
              {#if bug.assigned_to_detail}
                <p class="details">
                  <strong>Assigned to:</strong> {bug.assigned_to_detail.real_name} ({bug.assigned_to_detail.email})
                </p>
              {/if}
              {#if bug.creator_detail}
                <p class="details">
                  <strong>Creator:</strong> {bug.creator_detail.real_name} ({bug.creator_detail.email})
                </p>
              {/if}
              <p class="details">
                <strong>Created on:</strong> {new Date(bug.creation_time).toLocaleDateString()} |
                <strong>Last modified:</strong> {new Date(bug.last_change_time).toLocaleDateString()}
              </p>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="no-bugs">No flagged bugs found.</p>
      {/if}
    </div>
  
    <div class="section">
      <h2 class="section-title">Recently Commented Bugs</h2>
      {#if commentedBugs.length > 0}
        <ul class="bug-list">
          {#each commentedBugs as bug}
            <li class="bug-item">
              <h2><a href={`/bugs/${bug.id}`}>{bug.summary}</a></h2>
              <p><strong>Status:</strong> {bug.status} <strong>Resolution:</strong> {bug.resolution}</p>
              <p class="details">
                <strong>ID:</strong> {bug.id} |
                <strong>Type:</strong> {bug.type} |
                <strong>Severity:</strong> {bug.severity} |
                <strong>Priority:</strong> {bug.priority}
              {#if bug.assigned_to_detail}
                <p class="details">
                  <strong>Assigned to:</strong> {bug.assigned_to_detail.real_name} ({bug.assigned_to_detail.email})
                </p>
              {/if}
              {#if bug.creator_detail}
                <p class="details">
                  <strong>Creator:</strong> {bug.creator_detail.real_name} ({bug.creator_detail.email})
                </p>
              {/if}
              <p class="details">
                <strong>Created on:</strong> {new Date(bug.creation_time).toLocaleDateString()} |
                <strong>Last modified:</strong> {new Date(bug.last_change_time).toLocaleDateString()}
              </p>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="no-bugs">No recently commented bugs found.</p>
      {/if}
    </div>
  
    <div class="section">
      <h2 class="section-title">Recently Closed Bugs</h2>
      {#if closedBugs.length > 0}
        <ul class="bug-list">
          {#each closedBugs as bug}
            <li class="bug-item">
              <h2><a href={`/bugs/${bug.id}`}>{bug.summary}</a></h2>
              <p><strong>Status:</strong> {bug.status} <strong>Resolution:</strong> {bug.resolution}</p>
              <p class="details">
                <strong>ID:</strong> {bug.id} |
                <strong>Type:</strong> {bug.type} |
                <strong>Severity:</strong> {bug.severity} |
                <strong>Priority:</strong> {bug.priority}
              </p>
              {#if bug.assigned_to_detail}
                <p class="details">
                  <strong>Assigned to:</strong> {bug.assigned_to_detail.real_name} ({bug.assigned_to_detail.email})
                </p>
              {/if}
              {#if bug.creator_detail}
                <p class="details">
                  <strong>Creator:</strong> {bug.creator_detail.real_name} ({bug.creator_detail.email})
                </p>
              {/if}
              <p class="details">
                <strong>Created on:</strong> {new Date(bug.creation_time).toLocaleDateString()} |
                <strong>Last modified:</strong> {new Date(bug.last_change_time).toLocaleDateString()}
              </p>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="no-bugs">No recently closed bugs found.</p>
      {/if}
    </div>
  </div>
  