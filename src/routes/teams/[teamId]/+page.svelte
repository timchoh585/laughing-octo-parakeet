<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { writable, derived } from 'svelte/store';

    let sprints = writable([]);
    let newSprintName = writable('');
    let error = writable(null);
    let teamId = null;
    let sortOrder = writable('asc');
    let sprintToDelete = writable(null);
    let deleteConfirmation = writable('');
    let modalError = writable(null); // Store for error messages in the modal

    $: teamId = $page.params.teamId;

    onMount(async () => {
        if (!teamId) {
            error.set('teamId is missing.');
            return;
        }

        try {
            const res = await fetch(`/teams/${teamId}`);
            if (res.ok) {
                sprints.set(await res.json());
                error.set(null);
            } else {
                error.set(`Failed to load sprints: ${res.statusText}`);
            }
        } catch (err) {
            error.set(`Failed to load sprints: ${err.message}`);
        }
    });

    const sortedSprints = derived([sprints, sortOrder], ([$sprints, $sortOrder]) => {
        return $sprints.slice().sort((a, b) => {
            if ($sortOrder === 'asc') {
                return a.name.localeCompare(b.name);
            } else {
                return b.name.localeCompare(a.name);
            }
        });
    });

    const addSprint = async () => {
        const sprintName = $newSprintName.trim();
        if (!sprintName) {
            error.set('Sprint name cannot be empty');
            return;
        }

        if (!teamId) {
            error.set('teamId is missing.');
            return;
        }

        try {
            const res = await fetch(`/teams/${teamId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: sprintName })
            });

            if (res.ok) {
                const newSprint = await res.json();
                sprints.update(current => [...current, newSprint]);
                newSprintName.set('');
                error.set(null);
            } else {
                const errorData = await res.json();
                error.set(errorData.error || 'Failed to add sprint');
            }
        } catch (err) {
            error.set('An error occurred while adding the sprint');
        }
    };

    const deleteSprint = async (sprintId) => {
        try {
            const res = await fetch(`/teams/${teamId}/sprints/${sprintId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                sprints.update(current => current.filter(sprint => sprint.id !== sprintId));
                sprintToDelete.set(null);
                deleteConfirmation.set('');
                modalError.set(null);
            } else {
                const errorData = await res.json();
                modalError.set(errorData.error || 'Failed to delete sprint');
            }
        } catch (err) {
            modalError.set('An error occurred while deleting the sprint');
        }
    };

    const handleSprintClick = (sprintId) => {
        goto(`/teams/${teamId}/sprints/${sprintId}`);
    };

    const toggleSortOrder = () => {
        sortOrder.update(current => (current === 'asc' ? 'desc' : 'asc'));
    };

    const confirmDelete = () => {
        if ($deleteConfirmation === $sprintToDelete.name) {
            deleteSprint($sprintToDelete.id);
        } else {
            modalError.set('Sprint name does not match. Please type the correct name.');
        }
    };

    const closeModal = () => {
        sprintToDelete.set(null);
        deleteConfirmation.set('');
        modalError.set(null); // Clear modal error when closing
    };
</script>

<style>
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
    .error {
        color: red;
        margin-bottom: 1rem;
        text-align: center;
    }
    .sprint-list {
        list-style-type: none;
        padding: 0;
    }
    .sprint-list li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        margin-bottom: 0.5rem;
        background-color: #f9f9f9;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: background-color 0.3s ease;
    }
    .sprint-list li:hover {
        background-color: #e9e9e9;
    }
    .sprint-name {
        font-weight: bold;
        color: #333;
        cursor: pointer;
    }
    .sort-controls {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 1rem;
    }
    .sort-controls button {
        padding: 0.5rem;
        background: #28a745;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
    }
    .sort-controls button:hover {
        background: #218838;
    }
    .delete-button {
        background-color: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        padding: 0.5rem;
    }
    .delete-button:hover {
        background-color: #c82333;
    }
    /* Modal Styles */
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(0, 0, 0, 0.5);
    }
    .modal-content {
        background: #fff;
        padding: 2rem;
        border-radius: 8px;
        max-width: 500px;
        width: 100%;
    }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    .modal-header h2 {
        margin: 0;
    }
    .modal-header button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
    }
    .delete-confirmation {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 1rem;
    }
    .delete-confirmation input {
        margin-bottom: 0.5rem;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        width: 100%;
    }
    .delete-confirmation button {
        background-color: #dc3545;
        color: white;
        padding: 0.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
    }
    .delete-confirmation button:hover {
        background-color: #c82333;
    }
    .modal-error {
        color: red;
        margin-top: 0.5rem;
        text-align: center;
    }
</style>

<div class="container">
    <h1>Sprints</h1>

    {#if $error}
        <p class="error">{$error}</p>
    {/if}

    <div class="form">
        <input type="text" bind:value={$newSprintName} placeholder="Enter Unique As Possible sprint name" />
        <button on:click={addSprint}>Add Sprint</button>
    </div>

    <div class="sort-controls">
        <button on:click={toggleSortOrder}>
            Sort: {#if $sortOrder === 'asc'}Ascending{/if}{#if $sortOrder === 'desc'}Descending{/if}
        </button>
    </div>

    {#if $sprints && $sprints.length > 0}
        <ul class="sprint-list">
            {#each $sortedSprints as sprint}
                <li>
                    <span class="sprint-name" on:click={() => handleSprintClick(sprint.id)}>{sprint.name}</span>
                    <button class="delete-button" on:click={() => sprintToDelete.set(sprint)}>Delete</button>
                </li>
            {/each}
        </ul>
    {:else}
        <p>No sprints available.</p>
    {/if}

    {#if $sprintToDelete}
        <div class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Confirm Delete</h2>
                    <button on:click={closeModal}>&times;</button>
                </div>
                <div class="delete-confirmation">
                    <p>Type the name of the sprint to confirm deletion:</p>
                    <input type="text" bind:value={$deleteConfirmation} placeholder="Enter sprint name" />
                    <button on:click={confirmDelete}>Confirm Delete</button>
                    {#if $modalError}
                        <p class="modal-error">{$modalError}</p>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>
