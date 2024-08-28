<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { writable, derived } from 'svelte/store';
  import { teamsCache } from '../../stores/sprintStore';

  let teams = writable([]);
  let fetchError = writable(null);
  let newTeamName = writable('');
  let searchQuery = writable('');
  let isLoading = writable(true);

  $: if ($teamsCache.length > 0) {
    teams.set($teamsCache);
    isLoading.set(false);
  }

  onMount(async () => {
    if ($teamsCache.length === 0) {
      isLoading.set(true);
    }

    try {
      const res = await fetch('/teams');
      if (res.ok) {
        const fetchedTeams = await res.json();
        teamsCache.set(fetchedTeams);
        teams.set(fetchedTeams);
        fetchError.set(null);
      } else {
        fetchError.set(`Failed to load teams: ${res.statusText}`);
      }
    } catch (err) {
      fetchError.set(`Failed to load teams: ${err.message}`);
    } finally {
      isLoading.set(false);
    }
  });

  const filteredTeams = derived([teams, searchQuery], ([$teams, $searchQuery]) => {
    return $teams.filter(team => 
      team.name.toLowerCase().includes($searchQuery.toLowerCase())
    );
  });

  const handleTeamClick = (teamId) => {
    goto(`/teams/${teamId}`);
  };

  const addTeam = async () => {
    const trimmedName = $newTeamName.trim();
    if (trimmedName === '') {
      fetchError.set('Team name cannot be empty');
      return;
    }

    const existingTeam = $teams.find(team => team.name.toLowerCase() === trimmedName.toLowerCase());
    if (existingTeam) {
      fetchError.set('A team with this name already exists');
      return;
    }

    try {
      const res = await fetch('/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: trimmedName })
      });

      if (res.ok) {
        const { id: newTeamId } = await res.json();
        const updatedTeams = [...$teams, { id: newTeamId, name: trimmedName }];
        teamsCache.set(updatedTeams);
        teams.set(updatedTeams);
        newTeamName.set('');
        fetchError.set(null);
        goto(`/teams/${newTeamId}`);
      } else {
        fetchError.set(`Failed to add team: ${res.statusText}`);
      }
    } catch (err) {
      fetchError.set(`Failed to add team: ${err.message}`);
    }
  };
</script>

<style>
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
  .add-team, .search-bar {
    display: flex;
    margin-bottom: 1rem;
    gap: 0.5rem;
  }
  .search-bar input, .add-team input {
    flex: 1;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
  }
  .add-team button {
    padding: 0.5rem 1rem;
    border: none;
    background-color: #007BFF;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  .add-team button:hover {
    background-color: #0056b3;
  }
  .team-list {
    list-style-type: none;
    padding: 0;
  }
  .team-list li {
    padding: 1rem;
    margin-bottom: 0.5rem;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  .team-list li:hover {
    background-color: #e9e9e9;
  }
  .team-name {
    font-weight: bold;
    color: #333;
  }
</style>

<div class="container">
  <h1>Teams</h1>
  {#if $fetchError}
    <p class="error">{$fetchError}</p>
  {/if}

  {#if $isLoading && !$teams.length}
    <p>Loading teams...</p>
  {:else}
    <div class="search-bar">
      <input 
        type="text" 
        placeholder="Search teams..." 
        bind:value={$searchQuery} />
    </div>

    <div class="add-team">
      <input 
        type="text" 
        placeholder="Enter new team name" 
        bind:value={$newTeamName} />
      <button on:click={addTeam}>Add Team</button>
    </div>

    <ul class="team-list">
      {#each $filteredTeams as team}
        <li on:click={() => handleTeamClick(team.id)}>
          <span class="team-name">{team.name}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>
