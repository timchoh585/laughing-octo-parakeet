<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { searchWhiteboard, getBug, updateBug } from '../../../../api/api';
  import { writable, get } from 'svelte/store';
  import { whiteboardBugCache } from '../../../../stores/bugStore';
  import defectIcon from '../../../../resources/img/icons/defect.svg';
  import enhancementIcon from '../../../../resources/img/icons/enhancement.svg';
  import taskIcon from '../../../../resources/img/icons/task.svg';

  const typeIcons = {
    defect: defectIcon,
    enhancement: enhancementIcon,
    task: taskIcon,
  };

  let selectedStatus = writable('');
  let selectedAssignee = writable('');
  let selectedPriority = writable('');
  let newBugId = writable('');
  let sprintName = writable('');
  let whiteboardField = writable('');
  let newWhiteboard = writable('');
  let bugId = writable('');
  let appendString = writable('');
  let notification = writable('');
  let notificationType = writable('');
  let updating = writable(false);
  let error = writable(null);
  let loading = writable(false);
  let filteredBugs = writable([]);
  let selectAllChecked = writable(false);

  let bugs = [];
  let viewAsCards = false;
  let checkedBugIds = [];

  let sortColumn = writable('');
  let sortDirection = writable('asc');

  let selectNonResolvedOrVerifiedText = writable('Select Non-Resolved/Verified');

  $: {
    const nonResolvedOrVerifiedBugIds = get(filteredBugs)
      .filter(bug => bug.status !== 'RESOLVED' && bug.status !== 'VERIFIED')
      .map(bug => bug.id);

    const allSelected = nonResolvedOrVerifiedBugIds.every(id => checkedBugIds.includes(id));
    selectNonResolvedOrVerifiedText.set(allSelected ? 'Deselect Non-Resolved/Verified' : 'Select Non-Resolved/Verified');
  }


  $: whiteboard = $page.params.whiteboard;

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
      filteredBugs.set(cachedBugs);
    } else {
      loading.set(true);
    }

    try {
      const data = await searchWhiteboard(whiteboard);
      const fetchedBugs = data.bugs;

      if (JSON.stringify(cachedBugs) !== JSON.stringify(fetchedBugs)) {
        bugs = fetchedBugs;
        filteredBugs.set(fetchedBugs);
        whiteboardBugCache.update(cache => ({ ...cache, [whiteboard]: fetchedBugs }));
      }
      
      error.set(null);
    } catch (err) {
      console.error('Failed to fetch bugs:', err);
      error.set('Failed to fetch bugs');
    } finally {
      loading.set(false);
    }
  };

  const handleWhiteboardSearch = () => {
    const whiteboardValue = get(newWhiteboard).trim();
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
    const filtered = bugs.filter(bug => {
      const matchesStatus = !get(selectedStatus) || bug.status === get(selectedStatus);
      const matchesAssignee = !get(selectedAssignee) || 
        (bug.assigned_to_detail?.real_name || bug.assigned_to_detail?.email) === get(selectedAssignee);
      const matchesPriority = !get(selectedPriority) || bug.priority === get(selectedPriority);
      return matchesStatus && matchesAssignee && matchesPriority;
    });
    filteredBugs.set(filtered);
  };

  const handleAddBug = () => {
    const id = parseInt(get(bugId), 10);
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

  let previousStatus = '';

  const handleStatusClick = (status) => {
    if (get(selectedStatus) === status) {
      if (previousStatus === status) {
        selectedStatus.set('');
        previousStatus = '';
      } else {
        previousStatus = status;
      }
    } else {
      selectedStatus.set(status);
      previousStatus = status;
    }
    handleFilterChange();
  };

  const toggleSelectAll = () => {
    const isChecked = get(selectAllChecked);
    const filtered = get(filteredBugs);

    if (isChecked) {
      checkedBugIds = [];
    } else {
      checkedBugIds = filtered.map(bug => bug.id);
    }

    selectAllChecked.set(!isChecked);

    console.log("Selected tickets after toggleSelectAll:", checkedBugIds);
  };

  const selectNonResolvedOrVerified = () => {
    const filtered = get(filteredBugs);
    const nonResolvedOrVerifiedBugs = filtered.filter(bug => bug.status !== 'RESOLVED' && bug.status !== 'VERIFIED');
    const nonResolvedOrVerifiedBugIds = nonResolvedOrVerifiedBugs.map(bug => bug.id);
    const allSelected = nonResolvedOrVerifiedBugIds.every(id => checkedBugIds.includes(id));

    if (allSelected) {
      checkedBugIds = checkedBugIds.filter(id => !nonResolvedOrVerifiedBugIds.includes(id));
    } else {
      checkedBugIds = [...new Set([...checkedBugIds, ...nonResolvedOrVerifiedBugIds])];
    }

    selectAllChecked.set(checkedBugIds.length === filtered.length);

    console.log("Selected tickets after selectNonResolvedOrVerified:", checkedBugIds);
  };

  const handleCheckboxChange = (bugId) => {
    if (checkedBugIds.includes(bugId)) {
      checkedBugIds = checkedBugIds.filter(id => id !== bugId);
    } else {
      checkedBugIds = [...checkedBugIds, bugId];
    }

    console.log("Selected tickets after handleCheckboxChange:", checkedBugIds);
  };

  const handleUpdateBugs = () => {
    if (checkedBugIds.length === 0) {
      alert("Please select at least one bug to update.");
      return;
    }
    if (!get(appendString).trim()) {
      alert("Please enter text to append to the whiteboard.");
      return;
    }

    updateBugsWhiteboard();
  };

  const updateBugsWhiteboard = async () => {
    updating.set(true);
    try {
      const bugsToUpdate = get(selectedStatus) ? get(filteredBugs) : bugs;
      for (const bug of bugsToUpdate) {
        const updatedWhiteboard = `${bug.whiteboard} ${get(appendString)}`.trim();
        await updateBug(bug.id, { whiteboard: updatedWhiteboard });
      }
      notification.set('The tickets were updated successfully.');
      notificationType.set('success');
    } catch (err) {
      console.error('Failed to update bugs:', err);
      notification.set('Failed to update bugs.');
      notificationType.set('error');
    } finally {
      updating.set(false);
    }

    setTimeout(() => {
      notification.set('');
    }, 5000);
  };

  const quickAddBug = async () => {
    const id = parseInt(get(newBugId), 10);
    if (!isNaN(id) && id > 0) {
      await fetchBugDetails(id);
      await submitBug();
    } else {
      alert('Please enter a valid bug ID');
    }
  };

  const fetchBugDetails = async (bugId) => {
    try {
      const bug = await getBug(bugId);
      whiteboardField.set(bug.whiteboard || '');
    } catch (err) {
      console.error('Failed to fetch bug details:', err);
      error.set('Failed to fetch bug details');
    }
  };

  const submitBug = async () => {
    try {
      const updatedBugData = {
        whiteboard: get(whiteboardField) + get(sprintName)
      };
      await updateBug(get(newBugId), updatedBugData);
      fetchBugsByWhiteboard(get(sprintName));
    } catch (err) {
      console.error('Failed to update bug:', err);
      alert('Please enter a valid bug ID');
    }
  };

  onMount(() => {
    fetchBugsByWhiteboard(whiteboard);
    sprintName.set('[' + whiteboard + ']');
  });

  const sortIcons = {
    asc: '▲',
    desc: '▼'
  };

  const sortBugs = (column) => {
    if (get(sortColumn) === column) {
      sortDirection.set(get(sortDirection) === 'asc' ? 'desc' : 'asc');
    } else {
      sortColumn.set(column);
      sortDirection.set('asc');
    }

    const sorted = [...get(filteredBugs)].sort((a, b) => {
      let aValue, bValue;

      if (column === 'assigned_to_detail') {
        aValue = a.assigned_to_detail?.real_name?.toLowerCase() || a.assigned_to_detail?.email?.toLowerCase() || '';
        bValue = b.assigned_to_detail?.real_name?.toLowerCase() || b.assigned_to_detail?.email?.toLowerCase() || '';
      } else {
        aValue = a[column];
        bValue = b[column];

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      }

      if (aValue > bValue) return get(sortDirection) === 'asc' ? 1 : -1;
      if (aValue < bValue) return get(sortDirection) === 'asc' ? -1 : 1;
      return 0;
    });

    filteredBugs.set(sorted);
  };

</script>

<style src="../../../../styles/styles.css"></style>

<div class="container {$updating ? 'disabled' : ''}">
  {#if $error}
    <p class="error">{$error}</p>
  {/if}

  <h1>Bug List for Whiteboard: {whiteboard}</h1>

  <div class="search-container">
    <input type="text" bind:value={$newWhiteboard} placeholder="Search for new whiteboard" on:keypress={handleKeyPress} />
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

<!--   
  TODO: maybe we don't need this here
  <div class="search-container">
    <input type="text" bind:value={$bugId} placeholder="Enter Bug ID to edit" />
    <button on:click={handleAddBug}>Add a New Ticket</button>
  </div> -->
  
  <div class="update-whiteboard-container">
    <button 
      class="selection-button" 
      on:click={selectNonResolvedOrVerified}>
      {$selectNonResolvedOrVerifiedText}
    </button>
    <p class="selected-bugs-info">
      {#if checkedBugIds.length === 0}
        No tickets selected.
      {:else if checkedBugIds.length === 1}
        1 ticket selected.
      {:else}
        {checkedBugIds.length} tickets selected.
      {/if}
    </p>
    <input type="text" bind:value={$appendString} placeholder="Enter text to append to whiteboard" />
    <button on:click={handleUpdateBugs} disabled={$updating}>Update Selected Bugs</button>
  </div>

  <div class="quick-add-container">
    <h2>Quick Add Bug</h2>
    <div class="input-group">
      <input type="text" bind:value={$newBugId} placeholder="Enter Bug ID" />
      <input type="text" bind:value={$sprintName} placeholder="Enter Whiteboard Name" />
      <button on:click={quickAddBug}>Quick Add Bug</button>
    </div>
  </div>

  <div class="view-toggle">
    <button on:click={() => viewAsCards = !viewAsCards}>
      {viewAsCards ? 'Switch to Row View' : 'Switch to Card View'}
    </button>
  </div>

  {#if $notification}
    <p class="notification {`notification-${$notificationType}`}" role="alert">
      {$notification}
    </p>
  {/if}

  {#if $loading && !$filteredBugs.length}
    <p class="loading">Loading...</p>
  {/if}

  {#if $filteredBugs.length > 0}

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
    {#if viewAsCards}
      <!-- Card View -->

      <ul class="bug-list">
        {#each $filteredBugs as bug}
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
    {:else}
      <!-- Row View -->
  <table class="bug-table">
    <thead>
      <tr>
        <th>
          Bulk Edit
          <p></p>
          <button
            class="selection-button {$selectAllChecked ? 'active' : ''}"
            on:click={toggleSelectAll}>
            {$selectAllChecked ? 'Deselect All' : 'Select All'}
          </button>
        </th>
        <th class="sortable" on:click={() => sortBugs('id')}>
          ID
          {#if $sortColumn === 'id'}
            <span>{$sortDirection === 'asc' ? sortIcons.asc : sortIcons.desc}</span>
          {/if}
        </th>
        <th class="sortable" on:click={() => sortBugs('type')}>
          Type
          {#if $sortColumn === 'type'}
            <span>{$sortDirection === 'asc' ? sortIcons.asc : sortIcons.desc}</span>
          {/if}
        </th>
        <th class="sortable" on:click={() => sortBugs('summary')}>
          Summary
          {#if $sortColumn === 'summary'}
            <span>{$sortDirection === 'asc' ? sortIcons.asc : sortIcons.desc}</span>
          {/if}
        </th>
        <th class="sortable" on:click={() => sortBugs('assigned_to_detail')}>
          Assigned to
          {#if $sortColumn === 'assigned_to_detail'}
            <span>{$sortDirection === 'asc' ? sortIcons.asc : sortIcons.desc}</span>
          {/if}
        </th>
        <th class="sortable" on:click={() => sortBugs('status')}>
          Status
          {#if $sortColumn === 'status'}
            <span>{$sortDirection === 'asc' ? sortIcons.asc : sortIcons.desc}</span>
          {/if}
        </th>
        <th class="sortable" on:click={() => sortBugs('resolution')}>
          Resolution
          {#if $sortColumn === 'resolution'}
            <span>{$sortDirection === 'asc' ? sortIcons.asc : sortIcons.desc}</span>
          {/if}
        </th>
      </tr>
    </thead>
    <tbody>
      {#each $filteredBugs as bug}
        <tr>
          <td on:click={() => handleCheckboxChange(bug.id)}>
            <button class="selection-button {checkedBugIds.includes(bug.id) ? 'active' : ''}">
              {checkedBugIds.includes(bug.id) ? 'Deselect' : 'Select'}
            </button>
          </td>
          <td><a href={`/bugs/${bug.id}`}>{bug.id}</a></td>
          <td>
            <img
              src={typeIcons[bug.type.toLowerCase()]}
              alt={bug.type}
              class="type-icon"
            />
          </td>          
          <td>{bug.summary}</td>
          <td>{bug.assigned_to_detail?.real_name || bug.assigned_to_detail?.email}</td>
          <td 
            class="status-cell" 
            style="
              --status-color: {statusColors[bug.status]};
              --status-color-r: {parseInt(statusColors[bug.status].slice(1, 3), 16)};
              --status-color-g: {parseInt(statusColors[bug.status].slice(3, 5), 16)};
              --status-color-b: {parseInt(statusColors[bug.status].slice(5, 7), 16)};
            ">
            {bug.status}
          </td>
          <td>{bug.resolution}</td>
        </tr>
      {/each}
    </tbody>
  </table>
    {/if}
  {:else if !$loading && !$filteredBugs.length}
    <p class="no-bugs">No bugs found for this whiteboard.</p>
  {/if}
</div>
