<script>
  import { onMount } from 'svelte';
  import { writable, get } from 'svelte/store';
  import { tick } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let team = writable(null);
  let sprints = writable([]);
  let filteredSprints = writable([]);
  let error = writable('');
  let query = writable('');
  let newSprintName = writable('');
  let sprintError = writable('');

  $: teamId = $page.params.teamId;

  const fetchTeamDetailsAndSprints = async (teamId) => {
    try {
      const res = await fetch(`/api/teams/${teamId}`);
      const text = await res.text();
      const data = JSON.parse(text);
      if (res.ok) {
        team.set(data.team);
        sprints.set(data.sprints);
        filteredSprints.set(data.sprints);
        error.set(null);
      } else {
        throw new Error(data.error || 'Failed to fetch team details and sprints');
      }
    } catch (err) {
      console.error('Failed to fetch team details and sprints:', err);
      error.set('An error occurred while fetching team details and sprints.');
    }
  };

  onMount(() => {
    fetchTeamDetailsAndSprints(teamId);
  });

  const handleSearch = () => {
    if (get(sprints).length) {
      const trimmedQuery = get(query).trim().toLowerCase();
      if (trimmedQuery === '') {
        filteredSprints.set(get(sprints));
      } else {
        filteredSprints.set(get(sprints).filter(sprint => sprint.name.toLowerCase().includes(trimmedQuery)));
      }
    }
  };

  let searchTimeout;
  const handleTyping = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      handleSearch();
      tick();
    }, 500);
  };

  const addSprint = async () => {
    sprintError.set('');
    const sprintName = get(newSprintName);
    const id = get(page).params.teamId;
    const form = new FormData();
    form.append('sprintName', sprintName);
    try {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'POST',
        body: form
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (res.ok) {
        sprints.update(currentSprints => [...currentSprints, data.newSprint]);
        filteredSprints.set(get(sprints));
        newSprintName.set('');
      } else {
        throw new Error(data.error || 'Failed to add sprint');
      }
    } catch (err) {
      console.error('Failed to add sprint:', err);
      sprintError.set(err.message);
    }
  };
</script>

<style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f4f4f9;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  h1 {
    color: #333;
    text-align: center;
  }
  .error {
    color: red;
    margin-bottom: 1rem;
    text-align: center;
  }
  .form {
    display: flex;
    flex-direction: column;
    margin-bottom: 2rem;
  }
  .form input {
    padding: 0.5rem;
    margin-bottom: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  .form button {
    padding: 0.5rem;
    background: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  .form button:hover {
    background: #0056b3;
  }
  .sprint-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .sprint-list li {
    background: #f9f9f9;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .sprint-list li a {
    text-decoration: none;
    color: #007bff;
    font-size: 1.1rem;
    font-weight: bold;
  }
  .sprint-list li:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  .sprint-list li:hover a {
    color: #0056b3;
  }
  .search {
    display: flex;
    flex-direction: column;
    margin-bottom: 2rem;
  }
  .search input {
    padding: 0.5rem;
    margin-bottom: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  .details {
    font-size: 0.9rem;
    color: #555;
  }
  .sprint-error {
    color: red;
    margin-top: 1rem;
    text-align: center;
  }
</style>

<div class="container">
  <h1>Sprints for {#if $team}{$team.name}{/if}</h1>
  <div class="search">
    <input type="text" bind:value={$query} on:input={handleTyping} placeholder="Search Sprints" />
  </div>
  <form class="form" on:submit|preventDefault={addSprint}>
    <input type="text" bind:value={$newSprintName} placeholder="Sprint Name" required />
    <button type="submit">Add Sprint</button>
  </form>
  {#if $error}
    <p class="error">{$error}</p>
  {/if}
  {#if $sprintError}
    <p class="sprint-error">{$sprintError}</p>
  {/if}
  {#if $filteredSprints.length > 0}
    <ul class="sprint-list">
      {#each $filteredSprints as sprint}
        <li>
          <a href={`/sprints/${teamId}/${sprint.id}`}>{sprint.name}</a>
          <p class="details">
            <strong>Created Time:</strong> {new Date(sprint.createdTime).toLocaleString()}<br>
            <strong>End Time:</strong> {sprint.endTime ? new Date(sprint.endTime).toLocaleString() : 'N/A'}<br>
            <strong>Number of Bugs:</strong> {sprint.numberOfBugs}<br>
            <strong>Resolved or Verified:</strong> {sprint.resolvedOrVerified}
          </p>
        </li>
      {/each}
    </ul>
  {:else}
    <p>No sprints found.</p>
  {/if}
</div>
