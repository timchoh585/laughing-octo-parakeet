<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import { getBug } from '../../../api/api';
  import { bugDetailsCache } from '../../../stores/bugDetailsStore';
  import { goto } from '$app/navigation';
  import BugDetails from './BugDetails.svelte';

  let bugData = null;
  let error = null;
  let selectedBug = null;
  let selectedBugDetails = null;

  $: bugId = parseInt(get(page).params.bugId, 10);

  const fetchAndCompareBug = async (bugId) => {
    try {
      const data = await getBug(bugId);
      const newBugData = data;

      let isDifferent = false;
      bugDetailsCache.update(cachedBugs => {
        isDifferent = JSON.stringify(cachedBugs[bugId]) !== JSON.stringify(newBugData);
        return { ...cachedBugs, [bugId]: newBugData };
      });

      if (isDifferent) {
        bugData = newBugData;
      } else {
        bugData = newBugData;
      }

      error = null;
    } catch (err) {
      console.error('Failed to fetch bug details:', err);
      error = 'An error occurred while fetching bug details.';
    }
  };

  const fetchBugDetails = async (bugId) => {
    try {
      selectedBugDetails = await getBug(bugId);
      selectedBug = bugId;
    } catch (err) {
      console.error('Failed to fetch bug details:', err);
    }
  };

  const closeBugDetails = () => {
    selectedBug = null;
    selectedBugDetails = null;
  };

  const handleEdit = () => {
    goto(`/bugs/edit/${bugId}`);
  };

  onMount(() => {
    const unsubscribe = bugDetailsCache.subscribe(cachedBugs => {
      fetchAndCompareBug(bugId).then(() => {
        unsubscribe();
      });
    });

    return () => unsubscribe();
  });
</script>

<style>
  .container {
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 8px;
    max-width: 900px;
    margin: 2rem auto;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    animation: fadeIn 0.5s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  h1 {
    color: #343a40;
    text-align: center;
    margin-bottom: 1rem;
    font-size: 2.5rem;
  }

  .error {
    color: #dc3545;
    margin-bottom: 1rem;
    text-align: center;
    font-size: 1.2rem;
  }

  .bug-details {
    background: #fff;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-top: 1rem;
  }

  .bug-details table {
    width: 100%;
    border-collapse: collapse;
  }

  .bug-details th,
  .bug-details td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
  }

  .bug-details th {
    background: #f1f1f1;
    color: #495057;
  }

  .edit-button {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  }

  .edit-button button {
    padding: 0.75rem 1.5rem;
    background: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.3s, transform 0.3s;
  }

  .edit-button button:hover {
    background: #0056b3;
    transform: translateY(-2px);
  }

  .edit-button button:active {
    transform: translateY(0);
  }

  .bugzilla-link {
    margin-top: 1rem;
    text-align: center;
  }

  .bugzilla-link a {
    color: #007bff;
    text-decoration: none;
    font-weight: bold;
  }

  .bugzilla-link a:hover {
    text-decoration: underline;
  }
</style>

<div class="container">
  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if bugData}
    <div>
      <h1>{bugData.summary}</h1>
      <div class="bug-details">
        <table>
          <tr>
            <th>Status</th>
            <td>{bugData.status}</td>
          </tr>
          <tr>
            <th>Resolution</th>
            <td>{bugData.resolution}</td>
          </tr>
          <tr>
            <th>Type</th>
            <td>{bugData.type}</td>
          </tr>
          <tr>
            <th>Severity</th>
            <td>{bugData.severity}</td>
          </tr>
          <tr>
            <th>Priority</th>
            <td>{bugData.priority}</td>
          </tr>
          <tr>
            <th>Assigned to</th>
            <td>{bugData.assigned_to_detail.real_name} ({bugData.assigned_to_detail.email})</td>
          </tr>
          <tr>
            <th>Creator</th>
            <td>{bugData.creator_detail.real_name} ({bugData.creator_detail.email})</td>
          </tr>
          <tr>
            <th>Created on</th>
            <td>{new Date(bugData.creation_time).toLocaleDateString()}</td>
          </tr>
          <tr>
            <th>Last modified</th>
            <td>{new Date(bugData.last_change_time).toLocaleDateString()}</td>
          </tr>
          <tr>
            <th>Description</th>
            <td>{bugData.description}</td>
          </tr>
          <tr>
            <th>Component</th>
            <td>{bugData.component}</td>
          </tr>
          <tr>
            <th>Product</th>
            <td>{bugData.product}</td>
          </tr>
          <tr>
            <th>Depends on</th>
            <td>
              {#if bugData.depends_on.length > 0}
                {#each bugData.depends_on as depId (depId)}
                  <a href="javascript:void(0)" on:click={() => fetchBugDetails(depId)}>
                    {depId}
                  </a>{' '}
                {/each}
              {:else}
                None
              {/if}
            </td>
          </tr>
          <tr>
            <th>Blocks</th>
            <td>
              {#if bugData.blocks.length > 0}
                {#each bugData.blocks as blockId (blockId)}
                  <a href="javascript:void(0)" on:click={() => fetchBugDetails(blockId)}>
                    {blockId}
                  </a>{' '}
                {/each}
              {:else}
                None
              {/if}
            </td>
          </tr>
          <tr>
            <th>Whiteboard</th>
            <td>{bugData.whiteboard}</td>
          </tr>
          <tr>
            <th>Bugzilla Link</th>
            <td><a href="https://bugzilla.mozilla.org/show_bug.cgi?id={bugId}">View on Bugzilla</a></td>
          </tr>
        </table>
      </div>
      <div class="edit-button">
        <button on:click={handleEdit}>Edit Bug</button>
      </div>
    </div>
  {:else}
    <p class="error">Bug details not available.</p>
  {/if}
  {#if selectedBug}
    <BugDetails bugId={selectedBug} bugDetails={selectedBugDetails} onClose={closeBugDetails} />
  {/if}
</div>
