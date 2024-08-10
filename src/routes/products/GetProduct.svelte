<!-- src/routes/Products/GetProduct.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { getProduct } from '../../api/api'; // Ensure you have an API utility file to handle the request
  
    let productId: string = '';
    let productData: any = null;
    let error: string | null = null;
  
    const fetchProduct = async () => {
      try {
        if (productId) {
          const data = await getProduct(Number(productId));
          productData = data.product;
          error = null;
        }
      } catch (err) {
        if (err instanceof Error) {
          error = 'Error: ' + err.message;
        } else {
          error = 'An unknown error occurred';
        }
        productData = null;
      }
    };
  
    onMount(() => {
      fetchProduct();
    });
  </script>
  
  <style>
    .container {
      padding: 1rem;
    }
    .error {
      color: red;
    }
    .product {
      border: 1px solid #ccc;
      padding: 0.5rem;
      margin-bottom: 0.5rem;
    }
  </style>
  
  <div class="container">
    <h2>Get Product</h2>
  
    {#if error}
      <p class="error">{error}</p>
    {/if}
  
    {#if productData}
      <div class="product">
        <p><strong>ID:</strong> {productData.id}</p>
        <p><strong>Name:</strong> {productData.name}</p>
        <p><strong>Description:</strong> {productData.description}</p>
        <!-- Render other product details as needed -->
      </div>
    {/if}
  </div>
  