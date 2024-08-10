<script>
    import { onMount } from 'svelte';
    import { routeParams } from '../../stores/stores';
    import { getBugs } from '../../api/api';
    import { bugCache } from '../../stores/bugStore';
    import { writable } from 'svelte/store';
  
    let productName = '';
    let componentName = '';
    let bugs = [];
    let filteredBugs = [];
    let error = null;
    let bugIdQuery = writable('');
    let bugNameQuery = writable('');
  
    const fetchAndCompareBugs = async (productName, componentName) => {
      try {
        const data = await getBugs(productName, componentName);
        const newBugs = data.bugs;
  
        // Compare newBugs with cachedBugs
        let isDifferent = false;
        bugCache.update(cachedBugs => {
          isDifferent = JSON.stringify(cachedBugs) !== JSON.stringify(newBugs);
          return newBugs;
        });
  
        if (isDifferent) {
          bugs = newBugs;
          filteredBugs = newBugs;
        }
  
        error = null;
      } catch (err) {
        console.error('Failed to fetch bugs:', err);
        error = 'An error occurred while fetching bugs.';
      }
    };
  
    const handleSearch = () => {
      const idQuery = $bugIdQuery.trim();
      const nameQuery = $bugNameQuery.trim().toLowerCase();
      filteredBugs = bugs.filter(bug => {
        const matchesId = idQuery === '' || bug.id.toString().includes(idQuery);
        const matchesName = nameQuery === '' || bug.summary.toLowerCase().includes(nameQuery);
        return matchesId && matchesName;
      });
    };
  
    let debounceTimeout;
    const handleTyping = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        handleSearch();
      }, 500);
    };
  
    onMount(() => {
      routeParams.subscribe(async (params) => {
        productName = params.productName;
        componentName = params.componentName;
  
        if (productName && componentName) {
          // Use cached data first
          const unsubscribe = bugCache.subscribe(cachedBugs => {
            bugs = cachedBugs;
            filteredBugs = cachedBugs;
          });
  
          // Fetch and compare with network data
          await fetchAndCompareBugs(productName, componentName);
  
          unsubscribe();
        }
      });
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
    .search-container {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .search-container input {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    .bug-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .bug-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1rem;
      background-color: #f9f9f9;
      display: flex;
      flex-direction: column;
    }
    .bug-item h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.2rem;
    }
    .bug-item p {
      margin: 0.5rem 0;
      flex-grow: 1;
    }
    .bug-item .details {
      font-size: 0.9rem;
      color: #555;
    }
    .bug-item a {
      text-decoration: none;
      color: #007bff;
      word-break: break-word;
    }
    .bug-item a:hover {
      text-decoration: underline;
    }
    .no-bugs {
      color: #888;
      text-align: center;
    }
  </style>
  
  <div class="container">
    {#if error}
      <p class="error">{error}</p>
    {/if}
  
    {#if productName && componentName && filteredBugs.length > 0}
      <h1>Bug List for {componentName} in {productName}</h1>
  
      <div class="search-container">
        <input type="text" bind:value={$bugIdQuery} placeholder="Filter by Bug ID" on:input={handleTyping} />
        <input type="text" bind:value={$bugNameQuery} placeholder="Filter by Bug Name" on:input={handleTyping} />
      </div>
  
      <ul class="bug-list">
        {#each filteredBugs as bug}
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
    {:else if productName && componentName}
      <p class="no-bugs">No bugs found for this component.</p>
    {/if}
  </div>
  