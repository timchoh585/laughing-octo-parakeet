<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';
    import { getAssignedBugsByEmail, getFlaggedBugsByEmail, getRecentCommentedBugsByEmail, getRecentlyClosedBugsByEmail } from '../../../api/api';
    import { assignedBugsCache, flaggedBugsCache, commentedBugsCache, closedBugsCache } from '../../../stores/bugStore';
    import { writable } from 'svelte/store';
    import '../../../styles/styles.css';
  
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
  
  <div class="container">
    {#if error}
      <p class="error">{error}</p>
    {/if}
  
    <h1>Bug List for {email}</h1>
  
    <div class="email-search">
      <input type="text" bind:value={$newEmail} placeholder="Enter another email" />
      <button on:click={handleEmailChange}>Search</button>
    </div>
  
    <!-- Assigned Bugs Section -->
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
  
    <!-- Flagged Bugs Section -->
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
  
    <!-- Columns for Recently Commented and Recently Closed Bugs -->
    <div class="columns">
      <!-- Recently Commented Bugs Column -->
      <div class="column">
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
          <p class="no-bugs">No recently commented bugs found.</p>
        {/if}
      </div>
  
      <!-- Recently Closed Bugs Column -->
      <div class="column">
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
  </div>
  