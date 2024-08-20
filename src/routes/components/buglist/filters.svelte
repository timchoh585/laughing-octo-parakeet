<script>
    import { writable } from 'svelte/store';
    
    export let bugs = [];
    export let selectedStatus = writable('');
    export let selectedAssignee = writable('');
    export let selectedPriority = writable('');
    
    const handleFilterChange = () => {
      // logic to filter bugs based on the selected filters
    };
  </script>
  
  <style>
    .search-container {
      display: flex;
      justify-content: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  
    .search-container select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      margin-bottom: 0.5rem;
      flex: 1;
      min-width: 200px;
    }
  </style>
  
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
  