<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { loginWithApiKey, getToken, removeToken, searchBugs } from '../api/api';
    import { goto } from '$app/navigation';
  
    let apiKey = writable('');
    let error = writable(null);
    let isLoggedIn = writable(false);
    let bugId = writable('');
    let email = writable('');
    let whiteboard = writable('');
    let bugSearchQuery = writable('');
  
    const handleLogin = async () => {
      try {
        await loginWithApiKey($apiKey);
        isLoggedIn.set(true);
        error.set(null);
      } catch (err) {
        console.error('Login failed:', err);
        error.set('Login failed. Please check your API key and try again.');
        isLoggedIn.set(false);
      }
    };
  
    const handleRemoveApiKey = () => {
      removeToken();
      isLoggedIn.set(false);
      apiKey.set('');
    };
  
    const handleBugSearch = () => {
      const id = parseInt($bugId, 10);
      if (!isNaN(id) && id > 0) {
        goto(`/bugs/${id}`);
      } else {
        alert('Please enter a valid bug ID');
      }
    };
  
    const handleEmailSearch = () => {
      let emailValue = $email.trim();
      if (emailValue) {
        if (!emailValue.includes('@')) {
          emailValue += "@mozilla.com";
        }
        goto(`/userbugs/${encodeURIComponent(emailValue)}`);
      } else {
        alert('Please enter a valid email');
      }
    };
  
    const handleWhiteboardSearch = () => {
      const whiteboardValue = $whiteboard.trim();
      if (whiteboardValue) {
        goto(`/bugs/whiteboard/${encodeURIComponent(whiteboardValue)}`);
      } else {
        alert('Please enter a valid whiteboard');
      }
    };
    
    const handleAPISearch = async () => {
      const query = $bugSearchQuery.trim();

      if (query) {
        try {
          const data = await searchBugs(query);
          const searchedBugs = data.bugs;

          // Update bugs and filteredBugs with the search results
          bugs = searchedBugs;
          filteredBugs = searchedBugs;

          error = null;
        } catch (err) {
          console.error('Failed to search bugs:', err);
          error = 'An error occurred while searching bugs.';
        }
      }
    };

  
    // Check if API key is already set
    onMount(() => {
      if (getToken()) {
        isLoggedIn.set(true);
      }
    });
  </script>
  
  <style src="../styles/styles.css"></style>
  
  <div class="container">
    <h1>Welcome to another Bugzilla UI!</h1>
    {#if $error}
      <p class="error">{$error}</p>
    {/if}
    {#if $isLoggedIn}
      <p>Login successful!</p>
      <button class="remove-button" on:click={handleRemoveApiKey}>Remove API Key</button>
    {/if}
    {#if !$isLoggedIn}
        <h1>Login with API Key</h1>
        <form class="login-form" on:submit|preventDefault={handleLogin}>
        <input type="text" bind:value={$apiKey} placeholder="Enter API Key" required />
        <button type="submit">Login</button>
      </form>
      <a class="link help-link" href="https://bugzilla.mozilla.org/userprefs.cgi?tab=apikey" target="_blank">Need help getting an API key?</a>
    {/if}
  
    <p></p>
    <button class="navigation-button" on:click={() => goto("./products")}>Go to Products Page</button>
    <p></p>
  
    <form class="search-form" on:submit|preventDefault={handleBugSearch}>
      <input type="text" bind:value={$bugId} placeholder="Enter Bug ID" />
      <button type="submit">Search for bug</button>
    </form>
  
    <form class="search-form" on:submit|preventDefault={handleEmailSearch}>
      <input type="text" bind:value={$email} placeholder="Enter Email" />
      <button type="submit">Search for bugs by email</button>
    </form>
  
    <form class="search-form" on:submit|preventDefault={handleAPISearch}>
      <input type="text" bind:value={$bugSearchQuery} placeholder="Enter Bug search name" />
      <button type="submit">Search for bugs by name</button>
    </form>
  
    <form class="search-form" on:submit|preventDefault={handleWhiteboardSearch}>
      <input type="text" bind:value={$whiteboard} placeholder="Search for bug by whiteboard" />
      <button type="submit">Search for bugs by whiteboard</button>
    </form>

    <button class="navigation-button" on:click={() => goto("./sprints")}>Go to Sprints</button>
  </div>
  