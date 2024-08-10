<!-- src/App.svelte -->
<script>
    import { onMount } from 'svelte';
  </script>
  
  <main>
    <nav>
      <ul>
        <li><a href="/bugs/get">Get Bug</a></li>
        <!-- Add other navigation links here -->
      </ul>
    </nav>
    <slot></slot>
  </main>
  
  <style>
    nav {
      background-color: #f8f9fa;
      padding: 1rem;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      display: inline;
      margin-right: 1rem;
    }
    a {
      text-decoration: none;
      color: #007bff;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
  