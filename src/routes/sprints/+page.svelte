<script>
    import { onMount } from 'svelte';
    import { writable, derived } from 'svelte/store';
    import { tick } from 'svelte';
  
    let teams = writable([]);
    let newTeamName = writable('');
    let error = writable('');
    let searchQuery = writable('');
  
    const fetchTeams = async () => {
      try {
        const res = await fetch('/api/teams');
        const data = await res.json();
        if (res.ok) {
          teams.set(data.teams);
        } else {
          throw new Error(data.error || 'Failed to fetch teams');
        }
      } catch (err) {
        console.error('Failed to fetch teams:', err);
        error.set('Failed to fetch teams');
      }
    };
  
    const addTeam = async () => {
      error.set('');
      const form = new FormData();
      form.append('teamName', $newTeamName);
      try {
        const res = await fetch('/api/teams', {
          method: 'POST',
          body: form
        });
        const data = await res.json();
        if (res.ok) {
          teams.update(currentTeams => [...currentTeams, data.newTeam]);
          newTeamName.set('');
        } else {
          throw new Error(data.error || 'Failed to add team');
        }
      } catch (err) {
        console.error('Failed to add team:', err);
        error.set(err.message);
      }
    };
  
    onMount(() => {
      fetchTeams();
    });
  
    let searchTimeout;
    const handleSearchInput = () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        tick();  // Ensure reactive updates
      }, 100);
    };
  
    const filteredTeams = derived(
      [teams, searchQuery],
      ([$teams, $searchQuery]) => $teams.filter(team => team.name.toLowerCase().includes($searchQuery.toLowerCase()))
    );
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
    .team-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .team-list li {
      background: #f9f9f9;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .team-list li a {
      text-decoration: none;
      color: #007bff;
      font-size: 1.1rem;
      font-weight: bold;
    }
    .team-list li:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    .team-list li:hover a {
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
  </style>
  
  <div class="container">
    <h1>Team List</h1>
    <div class="search">
      <input type="text" bind:value={$searchQuery} on:input={handleSearchInput} placeholder="Search Teams" />
    </div>
    <form class="form" on:submit|preventDefault={addTeam}>
      <input type="text" bind:value={$newTeamName} placeholder="Team Name" required />
      <button type="submit">Add Team</button>
    </form>
    {#if $error}
      <p class="error">{$error}</p>
    {/if}
    {#if $filteredTeams.length > 0}
      <ul class="team-list">
        {#each $filteredTeams as team}
          <li><a href={`/sprints/${team.id}`}>{team.name}</a></li>
        {/each}
      </ul>
    {:else}
      <p>No teams found.</p>
    {/if}
  </div>
  