<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import { getComponent } from '../../../../../api/api';
  import { componentDetailsCache } from '../../../../../stores/componentDetailsStore';
  import { routeParams } from '../../../../../stores/stores';

  let componentData = null;
  let error = null;

  $: productName = $page.params.productName;
  $: componentName = $page.params.componentName;

  const fetchAndCompareComponent = async (productName, componentName) => {
    try {
      const data = await getComponent(productName, componentName);
      const newComponentData = data;

      // Compare newComponentData with cachedComponentData
      let isDifferent = false;
      componentDetailsCache.update(cachedComponents => {
        isDifferent = JSON.stringify(cachedComponents[componentName]) !== JSON.stringify(newComponentData);
        if (isDifferent) {
          return { ...cachedComponents, [componentName]: newComponentData };
        }
        return cachedComponents;
      });

      if (isDifferent) {
        componentData = newComponentData;
      }

      error = null;
    } catch (err) {
      console.error('Failed to fetch component details:', err);
      error = 'An error occurred while fetching component details.';
    }
  };

  onMount(() => {
    let unsubscribe;
    unsubscribe = componentDetailsCache.subscribe(cachedComponents => {
      if (cachedComponents[componentName]) {
        componentData = cachedComponents[componentName];
      } else {
        fetchAndCompareComponent(productName, componentName);
      }
    });
    return unsubscribe;
  });
</script>

<style>
  .container {
    padding: 2rem;
    background: #fff;
    border-radius: 8px;
    max-width: 900px;
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
  .component-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  .component-details p {
    margin: 0.5rem 0;
  }
  .component-details .details {
    font-size: 0.9rem;
    color: #555;
  }
  .component-details strong {
    color: #333;
  }
</style>

<div class="container">
  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if componentData}
    <div>
      <h1>
        <a href="/bugs" on:click={() => routeParams.set({ productName, componentName })}>
          {componentData.name}
        </a>
      </h1>
      <div class="component-details">
        <p><strong>Description:</strong> {componentData.description}</p>
        <p><strong>Product:</strong> {componentData.product}</p>
        <p><strong>Default Assignee:</strong> {componentData.default_assignee}</p>
        <p><strong>Default QA Contact:</strong> {componentData.default_qa_contact}</p>
        <p><strong>Is Active:</strong> {componentData.is_active ? 'Yes' : 'No'}</p>
        <p><strong>Team Name:</strong> {componentData.team_name}</p>
        <p><strong>Triage Owner:</strong> {componentData.triage_owner}</p>
      </div>
    </div>
  {:else}
    <p class="error">Component details not available.</p>
  {/if}
</div>
