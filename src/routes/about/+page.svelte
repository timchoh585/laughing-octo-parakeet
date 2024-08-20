<script>
  import { onMount } from 'svelte';

  // State variable holding content for the about page
  let aboutContent = 'This is the about page. Here you can find more information about our app and its purpose.';

  onMount(() => {
    // Initialization logic (if any) can go here
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
  p {
    margin-bottom: 1rem;
  }
  a {
    color: #0066cc;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
</style>

<div class="container">
  <h1>About Page</h1>
  <p>{aboutContent}</p>
  <p>
    This is a project made by Tim Choh (Android Engineer) to have a better view of Bugzilla.
  </p>
  <p>
    The roadmap for this project is 90% feature creep... so let me know if you want a certain feature in this project and I'll see when I have time to work on it.
  </p>
  <p>
    Ideally, this project would have things like sprint planning, bulk ticket editing, some type of metrics for things like velocity tracking, etc.
  </p>
  <p>
    Not optimized but still working on doing that. I have some things cached, but there's a lot of optimization that I can still do.
    I'm still learning how to optimize efficiently, so it could be a while.
  </p>
  <p>
    Feel free to browse (or contribute) to the <a href="https://github.com/timchoh585/laughing-octo-parakeet" target="_blank" rel="noopener noreferrer">codebase here!</a>
  </p>
</div>
