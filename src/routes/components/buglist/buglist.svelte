<script>
    export let bugs = [];
    export let statusColors = {
      NEW: '#f8d7da',
      ASSIGNED: '#e2e3ff',
      RESOLVED: '#d4edda',
      VERIFIED: '#cce5ff'
    };
  </script>
  
  <style>
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
  </style>
  
  <ul class="bug-list">
    {#each bugs as bug}
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
  
  {#if !bugs.length}
    <p class="no-bugs">No bugs found.</p>
  {/if}
  