<script>
    import { onMount } from 'svelte';
    import { listSelectableProducts, getProduct } from '../../api/api';
    import { productCache } from '../../stores/productStore';
    import { writable } from 'svelte/store';
  
    let products = [];
    let filteredProducts = [];
    let error = null;
    let query = writable('');
  
    const fetchProductDetails = async (productId) => {
      try {
        return await getProduct(productId);
      } catch (err) {
        console.error(`Failed to fetch details for product ${productId}:`, err);
        return null; // Handle error and return null for this product
      }
    };
  
    const fetchAndCompareProducts = async () => {
      try {
        const selectableProductIds = await listSelectableProducts();
        const productDetails = await Promise.all(selectableProductIds.map(fetchProductDetails));
        const newProducts = productDetails.filter(product => product !== null); // Filter out null values
  
        // Compare newProducts with cachedProducts
        let isDifferent = false;
        productCache.update(cachedProducts => {
          isDifferent = JSON.stringify(cachedProducts) !== JSON.stringify(newProducts);
          return newProducts;
        });
  
        if (isDifferent) {
          products = newProducts;
          filteredProducts = newProducts;
        }
  
        error = null;
      } catch (err) {
        console.error('Failed to fetch products:', err);
        error = 'An error occurred while fetching products.';
      }
    };
  
    const handleSearch = () => {
      const trimmedQuery = $query.trim().toLowerCase();
      if (trimmedQuery === '') {
        filteredProducts = products;
      } else {
        const isNumber = !isNaN(trimmedQuery);
        filteredProducts = products.filter(product => {
          return isNumber 
            ? product.id.toString().includes(trimmedQuery) 
            : product.name.toLowerCase().includes(trimmedQuery);
        });
      }
    };
  
    let debounceTimeout;
    const handleTyping = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        handleSearch();
      }, 1000);
    };
  
    onMount(() => {
      const unsubscribe = productCache.subscribe(cachedProducts => {
        products = cachedProducts;
        filteredProducts = cachedProducts;
      });
  
      fetchAndCompareProducts().then(() => {
        unsubscribe();
      });
  
      return () => unsubscribe();
    });
  </script>
  
  <style>
    .container {
      padding: 2rem;
      background: #fff;
      border-radius: 8px;
      max-width: 1200px;
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
    .search-container {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }
    .search-container input {
      padding: 0.5rem;
      margin-right: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    .search-container button {
      padding: 0.5rem 1rem;
      background: #007bff;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    .search-container button:hover {
      background: #0056b3;
    }
    .product-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      list-style: none;
      padding: 0;
    }
    .product-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1rem;
      background-color: #f9f9f9;
    }
    .product-item h2 {
      margin: 0;
      font-size: 1.2rem;
    }
    .product-item p {
      margin: 0.5rem 0;
    }
    .product-item .details {
      font-size: 0.9rem;
      color: #555;
    }
    .product-item a {
      text-decoration: none;
      color: #007bff;
    }
    .product-item a:hover {
      text-decoration: underline;
    }
    .no-products {
      color: #888;
      text-align: center;
    }
  </style>
  
  <div class="container">
    <h1>Product List</h1>
    <div class="search-container">
      <input type="text" bind:value={$query} placeholder="Search for a product" on:input={handleTyping} />
      <button on:click={handleSearch}>Search</button>
    </div>
    {#if error}
      <p class="error">{error}</p>
    {/if}
    {#if filteredProducts.length > 0}
      <ul class="product-list">
        {#each filteredProducts as product}
          <li class="product-item">
            <h2><a href={`/products/${product.name}`}>{product.name}</a></h2> <!-- Link to product's components page -->
            <p><strong>Description:</strong> {product.description}</p>
            <p class="details">
              <strong>Classification:</strong> {product.classification} |
              <strong>Is Active:</strong> {product.is_active ? 'Yes' : 'No'} |
              <strong>Default Milestone:</strong> {product.default_milestone}
            </p>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="no-products">No products found.</p>
    {/if}
  </div>
  