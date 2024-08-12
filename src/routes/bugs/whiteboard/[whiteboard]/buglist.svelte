<script>
    import { onMount } from 'svelte';
    import { writable, get } from 'svelte/store';
    import { goto } from '$app/navigation';
    import { searchWhiteboard, updateBug } from '../../../../api/api';
    import { whiteboardBugCache } from '../../../../stores/bugStore';
  
    export let whiteboard;
  
    let bugs = [];
    let filteredBugs = [];
    let error = null;
    let loading = false;
    let newWhiteboard = writable('');
    let bugId = writable('');
    let selectedStatus = writable('');
    let selectedAssignee = writable('');
    let selectedPriority = writable('');
    let appendString = writable('');
    let notification = writable('');
    let notificationType = writable(''); // success or error
    let updating = false; // To track the updating state
  
    const statusColors = {
      NEW: '#f8d7da',
      ASSIGNED: '#e2e3ff',
      RESOLVED: '#d4edda',
      VERIFIED: '#cce5ff'
    };
  
    const statusList = ['NEW', 'ASSIGNED', 'RESOLVED', 'VERIFIED'];
  
    const fetchBugsByWhiteboard = async (whiteboard) => {
      const cachedBugs = get(whiteboardBugCache)[whiteboard];
  
      if (cachedBugs) {
        bugs = cachedBugs;
        filteredBugs = cachedBugs;
      } else {
        loading = true;
      }
  
      try {
        const data = await searchWhiteboard(whiteboard);
        const fetchedBugs = data.bugs;
  
        if (JSON.stringify(cachedBugs) !== JSON.stringify(fetchedBugs)) {
          bugs = fetchedBugs;
          filteredBugs = fetchedBugs;
          whiteboardBugCache.update(cache => ({ ...cache, [whiteboard]: fetchedBugs })); // Update the cache
        }
  
        error = null;
      } catch (err) {
        console.error('Failed to fetch bugs:', err);
        error = 'Failed to fetch bugs';
      } finally {
        loading = false;
      }
    };
  
    const handleWhiteboardSearch = () => {
      const whiteboardValue = $newWhiteboard.trim();
      if (whiteboardValue) {
        goto(`/bugs/whiteboard/${encodeURIComponent(whiteboardValue)}`);
      } else {
        alert('Please enter a valid whiteboard');
      }
    };
  
    const handleKeyPress = (event) => {
      if (event.key === 'Enter') {
        handleWhiteboardSearch();
      }
    };
  
    const handleFilterChange = () => {
      filteredBugs = bugs.filter(bug => {
        const matchesStatus = !$selectedStatus || bug.status === $selectedStatus;
        const matchesAssignee = !$selectedAssignee || 
          (bug.assigned_to_detail?.real_name || bug.assigned_to_detail?.email) === $selectedAssignee;
        const matchesPriority = !$selectedPriority || bug.priority === $selectedPriority;
        return matchesStatus && matchesAssignee && matchesPriority;
      });
    };
  
    const handleAddBug = () => {
      const id = parseInt($bugId, 10);
      if (!isNaN(id) && id > 0) {
        goto(`/bugs/whiteboard/addbug/${id}`);
      } else {
        alert('Please enter a valid bug ID');
      }
    };
  
    const calculateStatusTotals = () => {
      const totals = statusList.reduce((acc, status) => {
        acc[status] = bugs.filter(bug => bug.status === status).length;
        return acc;
      }, {});
  
      const totalBugs = bugs.length;
      const progress = statusList.map(status => ({
        status,
        count: totals[status],
        percentage: (totals[status] / totalBugs) * 100
      }));
  
      return progress;
    };
  
    const handleStatusClick = (status) => {
      selectedStatus.set(status);
      handleFilterChange();
    };
  
    const updateBugsWhiteboard = async () => {
      updating = true;
      try {
        const bugsToUpdate = $selectedStatus ? filteredBugs : bugs;
        for (const bug of bugsToUpdate) {
          const updatedWhiteboard = `${bug.whiteboard} ${$appendString}`.trim();
          await updateBug(bug.id, { whiteboard: updatedWhiteboard });
        }
        notification.set('The tickets were updated successfully.');
        notificationType.set('success');
      } catch (err) {
        console.error('Failed to update bugs:', err);
        notification.set('Failed to update bugs.');
        notificationType.set('error');
      } finally {
        updating = false;
      }
  
      setTimeout(() => {
        notification.set('');
      }, 5000);
    };
  
    onMount(() => {
      fetchBugsByWhiteboard(whiteboard);
    });
  
    $: if (whiteboard) {
      fetchBugsByWhiteboard(whiteboard);
    };
  </script>
  
  <style>
    .container {
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 8px;
      max-width: 1200px;
      margin: 2rem auto;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
  
    h1 {
      color: #343a40;
      text-align: center;
      margin-bottom: 1rem;
      font-size: 2rem;
    }
  
    .error {
      color: #dc3545;
      margin-bottom: 1rem;
      text-align: center;
      font-size: 1.2rem;
    }
  
    .search-container {
      display: flex;
      justify-content: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  
    .search-container input, .search-container select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      margin-bottom: 0.5rem;
      flex: 1;
      min-width: 200px;
    }
  
    .search-container button {
      padding: 0.5rem 1rem;
      background: #007bff;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.3s;
    }
  
    .search-container button:hover {
      background: #0056b3;
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
      background-color: #fff;
      transition: box-shadow 0.3s ease;
      background-color: var(--status-color);
    }
  
    .bug-item:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
  
    .bug-item h2 {
      margin: 0;
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
      font-size: 1.2rem;
      margin-top: 2rem;
    }
  
    .loading {
      text-align: center;
      color: #007bff;
      font-size: 1.5rem;
      margin-top: 2rem;
      animation: pulse 1.5s infinite;
    }
  
    @keyframes pulse {
      0% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
      100% {
        opacity: 1;
      }
    }
  
    .progress-bar-container {
      display: flex;
      width: 100%;
      height: 20px;
      margin-top: 20px;
      border-radius: 10px;
      overflow: hidden;
      background: #e0e0e0;
    }
  
    .progress-segment {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      font-size: 0.8rem;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
      transition: background-color 0.3s ease;
      cursor: pointer;
    }
  
    .progress-segment:hover {
      outline: 2px solid #333;
      background-color: darken(10%);
    }
  
    .notification {
      padding: 1rem;
      margin-top: 1rem;
      border-radius: 5px;
      text-align: center;
      transition: opacity 0.3s ease;
    }
  
    .notification-success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
  
    .notification-error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
  
    .loading-spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-left-color: #007bff;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
      margin-left: 0.5rem;
    }
  
    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  
    .disabled {
      pointer-events: none;
      opacity: 0.6;
    }
  </style>
  
  <div class="container {updating ? 'disabled' : ''}">
    {#if error}
      <p class="error">{error}</p>
    {/if}
  
    <h1>Bug List for Whiteboard: {whiteboard}</h1>
  
    <div class="search-container">
      <input type="text" bind:value={$newWhiteboard} placeholder="Search for bug by whiteboard" on:keypress={handleKeyPress} />
      <button on:click={handleWhiteboardSearch}>Search</button>
    </div>
  
    <div class="search-container">
      <select bind:value={$selectedStatus} on:change={handleFilterChange}>
        <option value="">All Statuses</option>
        <option value="NEW">NEW</option>
        <option value="ASSIGNED">ASSIGNED</option>
        <option value="RESOLVED">RESOLVED</option>
        <option value="VERIFIED">VERIFIED</option>
      </select>
      <select bind:value={$selectedAssignee} on:change={handleFilterChange}>
        <option value="">All Assignees</option>
        {#each [...new Set(bugs.map(bug => bug.assigned_to_detail?.real_name || bug.assigned_to_detail?.email))] as assignee}
          {#if assignee}
            <option value={assignee}>{assignee}</option>
          {/if}
        {/each}
      </select>
      <select bind:value={$selectedPriority} on:change={handleFilterChange}>
        <option value="">All Priorities</option>
        {#each [...new Set(bugs.map(bug => bug.priority))] as priority}
          {#if priority}
            <option value={priority}>{priority}</option>
          {/if}
        {/each}
      </select>
    </div>
  
    <div class="search-container">
      <input type="text" bind:value={$bugId} placeholder="Enter Bug ID to add" />
      <button on:click={handleAddBug}>Add a New Ticket</button>
    </div>
  
    <div class="search-container">
      <input type="text" bind:value={$appendString} placeholder="String to append to whiteboard" />
      <button on:click={updateBugsWhiteboard} disabled={updating}>
        Append to Whiteboard
        {#if updating}
          <div class="loading-spinner"></div>
        {/if}
      </button>
    </div>
  
    {#if $notification}
      <p class="notification {`notification-${$notificationType}`}" role="alert">
        {$notification}
      </p>
    {/if}
  
    {#if loading && !filteredBugs.length}
      <p class="loading">Loading...</p>
    {/if}
  
    {#if filteredBugs.length > 0}
      <div class="progress-bar-container" role="progressbar" aria-valuemin="0" aria-valuemax="100">
        {#each calculateStatusTotals() as { status, percentage, count }}
          {#if percentage > 0}
            <div
              class="progress-segment"
              tabindex="0"
              style="width: {percentage}%; background-color: {statusColors[status]}"
              on:click={() => handleStatusClick(status)}
              aria-label="{status} ({count} tickets, {percentage.toFixed(1)}%)"
              role="button"
            >
              {status} ({count})
            </div>
          {/if}
        {/each}
      </div>
  
      <ul class="bug-list">
        {#each filteredBugs as bug}
          <li class="bug-item" style="--status-color: {statusColors[bug.status]}">
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
                <strong>Assigned to:</strong> {bug.assigned_to_detail.real_name || bug.assigned_to_detail.email} ({bug.assigned_to_detail.email})
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
            <p><strong>Product:</strong> {bug.product}</p>
          </li>
        {/each}
      </ul>
    {:else if !loading && !filteredBugs.length}
      <p class="no-bugs">No bugs found for this whiteboard.</p>
    {/if}
  </div>
  