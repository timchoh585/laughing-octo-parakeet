<script src="./script.js"></script>
<style src="./styles.css"></style>

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

  <div class="quick-add-container">
    <h2>Quick Add Bug</h2>
    <div class="input-group">
      <input type="text" bind:value={$newBugId} placeholder="Enter Bug ID" />
      <input type="text" bind:value={$sprintName} placeholder="Enter Whiteboard Name" />
      <button on:click={quickAddBug}>Quick Add Bug</button>
    </div>
  </div>

  <!-- <div class="search-container">
    <input type="text" bind:value={$appendString} placeholder="String to append to whiteboard" />
    <button on:click={updateBugsWhiteboard} disabled={updating}>
      Append to Whiteboard
      {#if updating}
        <div class="loading-spinner"></div>
      {/if}
    </button>
  </div> -->

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
