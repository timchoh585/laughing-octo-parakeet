<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { writable } from 'svelte/store';
    import { getBug, updateBug } from '../../../../api/api';
    import { goto } from '$app/navigation';
  
    let bugId = $page.params.bugId;
    let summary = writable('');
    let description = writable('');
    let status = writable('');
    let priority = writable('');
    let assignedTo = writable('');
    let whiteboard = writable('');
    let error = null;
    let success = null;
  
    const fetchBugDetails = async (bugId) => {
      try {
        const bug = await getBug(bugId);
        summary.set(bug.summary);
        description.set(bug.description);
        status.set(bug.status);
        priority.set(bug.priority);
        assignedTo.set(bug.assigned_to_detail.email);
        whiteboard.set(bug.whiteboard || '');
      } catch (err) {
        console.error('Failed to fetch bug details:', err);
        error = 'Failed to fetch bug details';
      }
    };
  
    const submitBug = async () => {
      try {
        const updatedBugData = {
          summary: $summary,
          description: $description,
          status: $status,
          priority: $priority,
          assigned_to: $assignedTo,
          whiteboard: $whiteboard
        };
        await updateBug(bugId, updatedBugData);
        success = 'Bug updated successfully';
        setTimeout(() => {
          goto(`/bugs/${bugId}`);
        }, 2000);
      } catch (err) {
        console.error('Failed to update bug:', err);
        error = 'Failed to update bug';
      }
    };
  
    onMount(() => {
      fetchBugDetails(bugId);
    });
  </script>
  
  <style>
    .container {
      padding: 2rem;
      background: #fff;
      border-radius: 8px;
      max-width: 600px;
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
    .success {
      color: green;
      margin-bottom: 1rem;
      text-align: center;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
    }
    .form-group input, .form-group textarea, .form-group select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    .form-group textarea {
      height: 100px;
    }
    .form-group .button-container {
      text-align: center;
    }
    .form-group button {
      padding: 0.5rem 1rem;
      background: #007bff;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    .form-group button:hover {
      background: #0056b3;
    }
  </style>
  
  <div class="container">
    <h1>Edit Bug {bugId}</h1>
    
    {#if error}
      <p class="error">{error}</p>
    {/if}
    {#if success}
      <p class="success">{success}</p>
    {/if}
  
    <div class="form-group">
      <label for="summary">Summary</label>
      <textarea type="text" id="summary" bind:value={$summary} placeholder="Enter bug summary" />
    </div>
  
    <div class="form-group">
      <label for="description">Description</label>
      <textarea id="description" bind:value={$description} placeholder="Enter bug description"></textarea>
    </div>
  
    <div class="form-group">
      <label for="status">Status</label>
      <select id="status" bind:value={$status}>
        <option value="">Select Status</option>
        <option value="NEW">NEW</option>
        <option value="ASSIGNED">ASSIGNED</option>
        <option value="RESOLVED">RESOLVED</option>
        <option value="VERIFIED">VERIFIED</option>
      </select>
    </div>
  
    <div class="form-group">
      <label for="priority">Priority</label>
      <select id="priority" bind:value={$priority}>
        <option value="">Select Priority</option>
        <option value="P1">P1</option>
        <option value="P2">P2</option>
        <option value="P3">P3</option>
        <option value="P4">P4</option>
        <option value="P5">P5</option>
      </select>
    </div>
  
    <div class="form-group">
      <label for="assignedTo">Assigned To</label>
      <input type="text" id="assignedTo" bind:value={$assignedTo} placeholder="Enter assignee email" />
    </div>
  
    <div class="form-group">
      <label for="whiteboard">Whiteboard</label>
      <input type="text" id="whiteboard" bind:value={$whiteboard} placeholder="Enter whiteboard" />
    </div>
  
    <div class="form-group button-container">
      <button on:click={submitBug}>Submit Bug</button>
    </div>
  </div>
  