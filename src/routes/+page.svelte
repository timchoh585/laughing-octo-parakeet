<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { loginWithApiKey, getToken, removeToken } from '../api/api';
    import { goto } from '$app/navigation';
  
    let apiKey = writable('');
    let error = writable(null);
    let isLoggedIn = writable(false);
    let bugId = writable('');
    let email = writable('');
    let whiteboard = writable('');
  
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
  
    // Check if API key is already set
    onMount(() => {
      if (getToken()) {
        isLoggedIn.set(true);
      }
    });
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
    .login-form, .search-form {
      display: flex;
      flex-direction: column;
      margin-bottom: 2rem;
    }
    .login-form input, .search-form input {
      padding: 0.5rem;
      margin-bottom: 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    .login-form button, .search-form button {
      padding: 0.5rem;
      background: #007bff;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    .login-form button:hover, .search-form button:hover {
      background: #0056b3;
    }
    .remove-button {
      background: #ff9494;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      padding: 0.5rem 1rem;
      font-size: 1rem;
      margin-top: 1rem;
      display: block;
      width: 100%;
      text-align: center;
    }
    .remove-button:hover {
      background: #ff6666;
    }
    .link {
      display: inline-block;
      margin-top: 1rem;
      color: #007bff;
      text-decoration: none;
    }
    .link:hover {
      text-decoration: underline;
    }
    .help-link {
      display: block;
      margin-top: 1rem;
      text-align: center;
    }
  </style>
  
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
  
    <a class="link" href="/products">Go to Products Page</a>
    <p></p>
  
    <form class="search-form" on:submit|preventDefault={handleBugSearch}>
      <input type="text" bind:value={$bugId} placeholder="Enter Bug ID" />
      <button type="submit">Search for bug</button>
    </form>
  
    <form class="search-form" on:submit|preventDefault={handleEmailSearch}>
      <input type="text" bind:value={$email} placeholder="Enter Email" />
      <button type="submit">Search for bugs by email</button>
    </form>
  
    <form class="search-form" on:submit|preventDefault={handleWhiteboardSearch}>
      <input type="text" bind:value={$whiteboard} placeholder="Search for bug by whiteboard" />
      <button type="submit">Search</button>
    </form>
  </div>
  