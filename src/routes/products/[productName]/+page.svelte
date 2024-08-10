<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { getProduct } from '../../../api/api';
  import { productDetailsCache } from '../../../stores/productDetailsStore';
  import { writable } from 'svelte/store';

  let productData = null;
  let filteredComponents = [];
  let error = null;
  let query = writable('');

  $: productName = $page.params.productName;

  const fetchAndCompareProduct = async (productName) => {
    try {
      const data = await getProduct(productName);
      const newProductData = data;

      // Compare newProductData with cachedProductData
      let isDifferent = false;
      productDetailsCache.update(cachedProducts => {
        isDifferent = JSON.stringify(cachedProducts[productName]) !== JSON.stringify(newProductData);
        return { ...cachedProducts, [productName]: newProductData };
      });

      if (isDifferent) {
        productData = newProductData;
        filteredComponents = newProductData.components;
      }

      error = null;
    } catch (err) {
      console.error('Failed to fetch product details:', err);
      error = 'An error occurred while fetching product details.';
    }
  };

  onMount(() => {
    const unsubscribe = productDetailsCache.subscribe(cachedProducts => {
      if (cachedProducts[productName]) {
        productData = cachedProducts[productName];
        filteredComponents = cachedProducts[productName].components;
      } else {
        fetchAndCompareProduct(productName).then(() => {
          unsubscribe();
        });
      }
    });

    return () => unsubscribe();
  });

  const handleSearch = () => {
    if (productData && productData.components) {
      const trimmedQuery = $query.trim().toLowerCase();
      if (trimmedQuery === '') {
        filteredComponents = productData.components;
      } else {
        filteredComponents = productData.components.filter(component => component.name.toLowerCase().includes(trimmedQuery));
      }
    }
  };

  let debounceTimeout;
  const handleTyping = () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      handleSearch();
    }, 1000);
  };
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
  .component-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    list-style: none;
    padding: 0;
  }
  .component-item {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 1rem;
    background-color: #f9f9f9;
  }
  .component-item h2 {
    margin: 0;
    font-size: 1.2rem;
  }
  .component-item p {
    margin: 0.5rem 0;
  }
  .component-item .details {
    font-size: 0.9rem;
    color: #555;
  }
  .component-item a {
    text-decoration: none;
    color: #007bff;
  }
  .component-item a:hover {
    text-decoration: underline;
  }
  .no-components {
    color: #888;
    text-align: center;
  }
</style>

<div class="container">
  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if productData}
    <div>
      <h1>Components of {productData.name}</h1>
      <div class="search-container">
        <input type="text" bind:value={$query} placeholder="Search for a component" on:input={handleTyping} />
      </div>
      <ul class="component-list">
        {#each filteredComponents as component}
          <li class="component-item">
            <h2><a href={`/products/${productName}/components/${component.name}`}>{component.name}</a></h2> <!-- Link to component details page -->
            <p><strong>Description:</strong> {component.description}</p>
            <p class="details">
              <strong>Product:</strong> {component.product} |
              <strong>Default Assignee:</strong> {component.default_assignee} |
              <strong>Default QA Contact:</strong> {component.default_qa_contact}
            </p>
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <p class="no-components">No components found.</p>
  {/if}
</div>
