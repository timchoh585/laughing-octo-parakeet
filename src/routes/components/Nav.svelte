<script>
    import { page } from '$app/stores';
    
    $: currentPath = $page.url.pathname;
  </script>
  
  <style>
    nav {
      background-color: #007bff;
      padding: 1rem;
      color: white;
    }
    nav ul {
      list-style-type: none;
      margin: 0;
      padding: 0;
      display: flex;
    }
    nav ul li {
      margin-right: 1rem;
    }
    nav ul li a {
      color: white;
      text-decoration: none;
    }
    nav ul li a.active {
      font-weight: bold;
    }
    .nav-container {
      max-width: 800px;
      margin: 0 auto;
    }
  </style>
  
  <div class="nav-container">
    <nav>
      <ul>
        <li><a href="/" class:active={currentPath === '/'}>Home</a></li>
        <li><a href="/about" class:active={currentPath === '/about'}>About</a></li>
        <!-- Add more links here -->
      </ul>
    </nav>
  </div>
  