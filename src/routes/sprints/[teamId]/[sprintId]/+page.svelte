<script>
    import { onMount } from 'svelte';
    import { writable, get } from 'svelte/store';
    import { page } from '$app/stores';
    import { searchWhiteboard, getBug, updateBug } from '../../../../api/api';
    import { whiteboardBugCache } from '../../../../stores/bugStore';

    let sprint = writable(null);
    let error = writable('');
    let filteredBugs = writable([]);
    let newBugId = writable('');
    let loading = writable(false);
    let bugs = writable([]);
    let bugId = writable('');
    let bugError = writable('');
    let sprintName = writable('');
    let selectedStatus = writable('');
    let lastSelectedStatus = writable('');
    let selectedAssignee = writable('');
    let selectedPriority = writable('');
    let whiteboardField = writable('');

    let showEditEndTimeModal = writable(false);
    let newEndTime = writable('');

    $: teamId = $page.params.teamId;
    $: sprintId = $page.params.sprintId;

    const statusColors = {
        NEW: '#f8d7da',
        ASSIGNED: '#e2e3ff',
        RESOLVED: '#d4edda',
        VERIFIED: '#cce5ff'
    };

    const statusList = ['NEW', 'ASSIGNED', 'RESOLVED', 'VERIFIED'];

    const fetchSprintDetails = async (teamId, sprintId) => {
        try {
            const res = await fetch(`/api/teams/${teamId}/sprints/${sprintId}`);
            const text = await res.text();
            console.log('Sprint response status:', res.status);
            console.log('Sprint response text:', text);
            const data = JSON.parse(text);
            if (res.ok) {
                sprint.set(data.sprint);
                bugs.set(data.sprint.bugs);
                sprintName.set(data.sprint.name);
                error.set(null);
            } else {
                throw new Error(data.error || 'Failed to fetch sprint details');
            }
        } catch (err) {
            console.error('Failed to fetch sprint details:', err);
            error.set('An error occurred while fetching sprint details.');
        }
    };

    const fetchBugsByWhiteboard = async (sprintName) => {
        loading.set(true);
        try {
            const data = await searchWhiteboard(sprintName);
            const fetchedBugs = data.bugs;
            filteredBugs.set(fetchedBugs);
            bugs.set(fetchedBugs);
            bugError.set(null);
        } catch (err) {
            console.error('Failed to fetch bugs:', err);
            bugError.set('Failed to fetch bugs');
        } finally {
            loading.set(false);
        }
    };

    const handleFilterChange = () => {
        filteredBugs.set(get(bugs).filter(bug => {
            const matchesStatus = !get(selectedStatus) || bug.status === get(selectedStatus);
            const matchesAssignee = !get(selectedAssignee) ||
                (bug.assigned_to_detail?.real_name || bug.assigned_to_detail?.email) === get(selectedAssignee);
            const matchesPriority = !get(selectedPriority) || bug.priority === get(selectedPriority);
            return matchesStatus && matchesAssignee && matchesPriority;
        }));
    };

    const handleStatusClick = (status) => {
        if (get(selectedStatus) === status) {
            selectedStatus.set('');
        } else {
            selectedStatus.set(status);
        }
        lastSelectedStatus.set(status);
        handleFilterChange();
    };

    const calculateStatusTotals = () => {
        const totalBugs = get(bugs);
        const totals = statusList.reduce((acc, status) => {
            acc[status] = totalBugs.filter(bug => bug.status === status).length;
            return acc;
        }, {});

        const progress = statusList.map(status => ({
            status,
            count: totals[status],
            percentage: (totals[status] / totalBugs.length) * 100
        }));

        return progress;
    };

    const handleAddBug = async () => {
        const id = parseInt(get(newBugId), 10);
        if (!isNaN(id) && id > 0) {
            loading.set(true);
            await fetchBugDetails(id);
            await submitBug();
        } else {
            alert('Please enter a valid bug ID');
        }
    };

    const fetchBugDetails = async (bugId) => {
        try {
            const bug = await getBug(bugId);
            whiteboardField.set(bug.whiteboard || '');
        } catch (err) {
            console.error('Failed to fetch bug details:', err);
            error.set('Failed to fetch bug details');
        }
    };

    const submitBug = async () => {
        try {
            const updatedBugData = {
                whiteboard: get(whiteboardField) + '[' + get(sprintName) + ']'
            };
            await updateBug(get(newBugId), updatedBugData);
            fetchBugsByWhiteboard(get(sprintName));
        } catch (err) {
            console.error('Failed to update bug:', err);
            alert('Please enter a valid bug ID');
        }
    };

    const toggleEditEndTimeModal = () => {
        showEditEndTimeModal.update(value => !value);
    };

    const handleSubmitEndTime = async () => {
        try {
            const response = await fetch(`/api/teams/${teamId}/sprints/${sprintId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endTime: get(newEndTime) })
            });
            if (response.ok) {
                const updatedSprint = await response.json();
                sprint.set(updatedSprint.sprint);
                toggleEditEndTimeModal();
            } else {
                const errorData = await response.json();
                console.error('Failed to update end time:', errorData.error);
            }
        } catch (error) {
            console.error('Failed to update end time:', error);
        }
    };

    onMount(async () => {
        await fetchSprintDetails(teamId, sprintId);
        const sprintNameValue = get(sprintName);
        if (sprintNameValue) {
            await fetchBugsByWhiteboard(sprintNameValue);
        }
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
    .details {
        font-size: 1rem;
        color: #555;
    }
    .bugs {
        margin-top: 2rem;
    }

    .bug-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        list-style: none;
        padding: 0;
    }

    .bug-item {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 1rem;
        background-color: #fff;
        transition: box-shadow 0.3s ease;
        background-color: var(--status-color);
    }

    .bug-item:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .bug-item h2 {
        margin: 0;
        font-size: 1.2rem;
    }

    .bug-item p {
        margin: 0.5rem 0;
        flex-grow: 1;
    }

    .bug-item .details {
        font-size: 0.9rem;
        color: #555;
    }

    .bug-item a {
        text-decoration: none;
        color: #007bff;
        word-break: break-word;
    }

    .bug-item a:hover {
        text-decoration: underline;
    }

    .progress-bar-container {
        display: flex;
        width: 100%;
        height: 40px;
        margin-top: 20px;
        border-radius: 10px;
        overflow: hidden;
        background: #e0e0e0;
    }

    .progress-segment {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-size: 0.8rem;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
        transition: background-color 0.3s ease;
        cursor: pointer;
    }

    .progress-segment:hover {
        outline: 2px solid #333;
        background-color: darken(10%);
    }

    .no-bugs {
        color: #888;
        text-align: center;
        font-size: 1.2rem;
        margin-top: 2rem;
    }

    .loading {
        text-align: center;
        color: #007bff;
        font-size: 1.5rem;
        margin-top: 2rem;
        animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
        0% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
        100% {
            opacity: 1;
        }
    }
    .add-bug {
        display: flex;
        align-items: center;
        margin-top: 1rem;
    }
    .add-bug input {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-right: 0.5rem;
    }
    .add-bug button {
        padding: 0.5rem 1rem;
        background: #007bff;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    .add-bug button:hover {
        background: #0056b3;
    }

    .loading-spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border-left-color: #007bff;
        animation: spin 1s ease infinite;
        margin: auto;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .modal {
        display: flex;
        justify-content: center;
        align-items: center;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
    }

    .modal-content {
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        max-width: 500px;
        width: 100%;
        text-align: center;
    }
</style>

<div class="container">
    {#if $error}
        <p class="error">{$error}</p>
    {:else if $sprint}
        <h1>{$sprint.name}</h1>
        <p class="details">
            <strong>Created Time:</strong> {new Date($sprint.createdTime).toLocaleString()}<br>
            <strong>End Time:</strong> {$sprint.endTime ? new Date($sprint.endTime).toLocaleString() : 'N/A'}<br>
            <strong>Number of Bugs:</strong> {$sprint.numberOfBugs}<br>
            <strong>Resolved or Verified:</strong> {$sprint.resolvedOrVerified}
        </p>
        <button on:click={toggleEditEndTimeModal}>Edit End Time</button>
        <div class="add-bug">
            <input type="text" bind:value={$newBugId} placeholder="New Bug ID" />
            <button on:click={handleAddBug}>Add Bug</button>
        </div>
        <div class="bugs">
            <h2>Bugs</h2>
            {#if $bugError}
                <p class="error">{$bugError}</p>
            {/if}
            {#if $loading}
                <div class="loading-spinner"></div>
            {:else}
                {#if $filteredBugs.length > 0}
                    <div class="progress-bar-container" role="progressbar" aria-valuemin="0" aria-valuemax="100">
                        {#each calculateStatusTotals() as { status, percentage, count }}
                            {#if percentage > 0}
                                <div
                                    class="progress-segment"
                                    tabindex="0"
                                    style="width: {percentage}%; background-color: {statusColors[status]}"
                                    on:click={() => handleStatusClick(status)}
                                    aria-label="{status} ({count} tickets, {percentage.toFixed(1)}%)"
                                    role="button"
                                >
                                    {status} ({count})
                                </div>
                            {/if}
                        {/each}
                    </div>

                    <ul class="bug-list">
                        {#each $filteredBugs as bug}
                            <li class="bug-item" style="--status-color: {statusColors[bug.status]}">
                                <h2><a href={`/bugs/${bug.id}`}>{bug.summary}</a></h2>
                                <p><strong>Status:</strong> {bug.status} <strong>Resolution:</strong> {bug.resolution}</p>
                                <p class="details">
                                    <strong>ID:</strong> {bug.id} |
                                    <strong>Type:</strong> {bug.type} |
                                    <strong>Severity:</strong> {bug.severity} |
                                    <strong>Priority:</strong> {bug.priority}
                                </p>
                                {#if bug.assigned_to_detail}
                                    <p class="details">
                                        <strong>Assigned to:</strong> {bug.assigned_to_detail.real_name || bug.assigned_to_detail.email} ({bug.assigned_to_detail.email})
                                    </p>
                                {/if}
                                {#if bug.creator_detail}
                                    <p class="details">
                                        <strong>Creator:</strong> {bug.creator_detail.real_name} ({bug.creator_detail.email})
                                    </p>
                                {/if}
                                <p class="details">
                                    <strong>Created on:</strong> {new Date(bug.creation_time).toLocaleDateString()} |
                                    <strong>Last modified:</strong> {new Date(bug.last_change_time).toLocaleDateString()}
                                </p>
                                <p><strong>Product:</strong> {bug.product}</p>
                            </li>
                        {/each}
                    </ul>
                {:else if !$loading && !$filteredBugs.length}
                    <p class="no-bugs">No bugs found for this whiteboard.</p>
                {/if}
            {/if}
        </div>
    {:else}
        <p>Loading...</p>
    {/if}
</div>

<!-- Modal for Editing End Time -->
{#if $showEditEndTimeModal}
    <div class="modal">
        <div class="modal-content">
            <h2>Edit End Time</h2>
            <input type="datetime-local" bind:value={newEndTime} />
            <button on:click={handleSubmitEndTime}>Submit</button>
            <button on:click={toggleEditEndTimeModal}>Cancel</button>
        </div>
    </div>
{/if}
