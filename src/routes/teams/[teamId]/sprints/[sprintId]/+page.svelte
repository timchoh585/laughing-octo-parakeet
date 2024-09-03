<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { writable, get } from 'svelte/store';
    import { goto } from '$app/navigation';
    import { getBugsDetails, hasReviewAttachment } from '../../../../../api/api';
    import defectIcon from '../../../../../resources/img/icons/defect.svg';
    import enhancementIcon from '../../../../../resources/img/icons/enhancement.svg';
    import taskIcon from '../../../../../resources/img/icons/task.svg';
    import { getLocalStorage, setLocalStorage } from '../../../../../utils/storageUtils';

    const typeIcons = {
        defect: defectIcon,
        enhancement: enhancementIcon,
        task: taskIcon,
    };

    let selectedCategory = writable('');
    let selectedAssignee = writable('');
    let selectedPriority = writable('');
    let selectedSprint = writable('');
    let availableSprints = writable([]);
    let notification = writable('');
    let notificationType = writable('');
    let updating = writable(false);
    let error = writable(null);
    let loading = writable(false);
    let filteredBugs = writable([]);
    let sprintName = writable('');
    let quickAddSprintName = writable('');
    let newBugId = writable('');
    let isExpanded = writable(false);

    let teamId;
    let sprintId;

    let checkedBugIdsByCategory = writable({
        todo: [],
        inProgress: [],
        inReview: [],
        done: []
    });

    let bugs = [];

    let sortConfig = writable({
        key: null,
        direction: 'asc'
    });

    const statusToCategory = {
        'NEW': 'To Do',
        'ASSIGNED': 'To Do',
        'IN_PROGRESS': 'In Progress',
        'IN_REVIEW': 'In Review',
        'RESOLVED': 'Done',
        'VERIFIED': 'Done'
    };

    const validCategories = ['To Do', 'In Progress', 'In Review', 'Done'];

    const categoryColors = {
        'todo': '#f8d7da',
        'inProgress': '#ffe8a1',
        'inReview': '#fff3cd',
        'done': '#d4edda',
    };

    const categoryOptions = [
        { label: 'To Do', value: 'To Do' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'In Review', value: 'In Review' },
        { label: 'Done', value: 'Done' }
    ];

    const categories = [
        { key: 'todo', label: 'To Do' },
        { key: 'inProgress', label: 'In Progress' },
        { key: 'inReview', label: 'In Review' },
        { key: 'done', label: 'Done' }
    ];

    const initializeBugs = () => ({
        todo: [],
        inProgress: [],
        inReview: [],
        done: []
    });

    const categorizeBugs = () => {
        const categorized = initializeBugs();
        const currentFilteredBugs = get(filteredBugs);

        currentFilteredBugs.forEach(bug => {
            const category = bug.category || 'Unknown';

            if (category === 'To Do') {
                categorized.todo.push(bug);
            } else if (category === 'In Progress') {
                categorized.inProgress.push(bug);
            } else if (category === 'In Review') {
                categorized.inReview.push(bug);
            } else if (category === 'Done') {
                categorized.done.push(bug);
            }
        });

        return categorized;
    };

    const calculateCategoryTotals = () => {
        const totals = {
            todo: 0,
            inProgress: 0,
            inReview: 0,
            done: 0
        };

        const currentFilteredBugs = get(filteredBugs);

        currentFilteredBugs.forEach(bug => {
            const category = bug.category || 'Unknown';

            if (category === 'To Do') {
                totals.todo += 1;
            } else if (category === 'In Progress') {
                totals.inProgress += 1;
            } else if (category === 'In Review') {
                totals.inReview += 1;
            } else if (category === 'Done') {
                totals.done += 1;
            }
        });

        return totals;
    };

    const fetchAvailableSprints = async () => {
        try {
            const response = await fetch(`/teams/${teamId}`);
            if (!response.ok) throw new Error('Failed to fetch sprints');
            const sprints = await response.json();
            availableSprints.set(sprints.filter(sprint => sprint.id !== sprintId));
        } catch (err) {
            console.error('Failed to fetch sprints:', err);
            error.set('Failed to fetch available sprints');
        }
    };

    const rollOverBugsToSprint = async () => {
        const targetSprintId = get(selectedSprint);
        const sourceSprintId = sprintId;
        const selectedBugIds = Object.values(get(checkedBugIdsByCategory)).flat();

        if (!targetSprintId || selectedBugIds.length === 0) {
            notification.set('Please select a sprint and some bugs.');
            notificationType.set('error');
            return;
        }

        try {
            loading.set(true);
            const response = await fetch(`/teams/${teamId}/sprints/${targetSprintId}/rollover`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bugIds: selectedBugIds, sourceSprintId }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to roll over bugs: ${errorText}`);
            }

            notification.set('Bugs rolled over successfully.');
            notificationType.set('success');
            unselectAllBugs();
        } catch (err) {
            notification.set('Failed to roll over selected bugs.');
            notificationType.set('error');
            console.error('Error rolling over selected bugs:', err);
        } finally {
            loading.set(false);
        }
    };

    let categorizedBugs = initializeBugs();
    let categoryTotals = initializeBugs();

    onMount(() => {
        teamId = $page.params.teamId;
        sprintId = $page.params.sprintId;

        if (teamId && sprintId) {
            const cachedBugs = getLocalStorage(`${teamId}-${sprintId}-bugs`);
            const cachedSprintName = getLocalStorage(`${teamId}-${sprintId}-name`);

            if (cachedBugs && cachedSprintName) {
                bugs = cachedBugs.map(bug => ({
                    ...bug,
                    category: bug.category || 'To Do'
                }));
                filteredBugs.set(bugs);
                sprintName.set(cachedSprintName);
                quickAddSprintName.set(`[${cachedSprintName}]`);
            }

            fetchSprintNameAndUpdate(teamId, sprintId);
        }

        fetchAvailableSprints();

        categorizedBugs = categorizeBugs();
        categoryTotals = calculateCategoryTotals();
    });

    const fetchSprintNameAndUpdate = async (teamId, sprintId) => {
        loading.set(true);
        try {
            const response = await fetch(`/teams/${teamId}/sprints/${sprintId}`);
            if (!response.ok) throw new Error('Failed to fetch sprint data');
            const sprintData = await response.json();
            sprintName.set(sprintData.name);
            quickAddSprintName.set(`[${sprintData.name}]`);
            setLocalStorage(`${teamId}-${sprintId}-name`, sprintData.name);
            await fetchBugIdsAndDetails(teamId, sprintId);

            categorizedBugs = categorizeBugs();
            categoryTotals = calculateCategoryTotals();
        } catch (err) {
            error.set('Failed to fetch sprint name');
        } finally {
            loading.set(false);
        }
    };

    const fetchBugIdsAndDetails = async (teamId, sprintId) => {
        try {
            const response = await fetch(`/teams/${teamId}/sprints/${sprintId}/bugs`);
            if (!response.ok) throw new Error('Failed to fetch bug IDs and categories');
            const data = await response.json();
            const bugDetails = data.bugs;
            await fetchAllBugDetails(bugDetails);

            categorizedBugs = categorizeBugs();
            categoryTotals = calculateCategoryTotals();
        } catch (err) {
            error.set('Failed to fetch bug IDs and categories');
        } finally {
            loading.set(false);
        }
    };

    const fetchAllBugDetails = async (bugDetails) => {
        loading.set(true);
        try {
            const bugIds = bugDetails.map(bug => bug.bugId);
            const fetchedBugs = await getBugsDetails(bugIds);

            const bugsWithCategory = await Promise.all(fetchedBugs.map(async (bug) => {
                const matchingBug = bugDetails.find(detail => detail.bugId === bug.id);
                let category = matchingBug?.category || statusToCategory[bug.status] || 'To Do';

                if (!validCategories.includes(category)) {
                    category = statusToCategory[bug.status] || 'To Do';
                    try {
                        await updateBugCategory(bug.id, category);
                    } catch (updateError) {
                        console.error(`Failed to update bug category in database for Bug ID ${bug.id}:`, updateError);
                    }
                }

                return {
                    ...bug,
                    category,
                };
            }));

            setLocalStorage(`${teamId}-${sprintId}-bugs`, bugsWithCategory);
            bugs = bugsWithCategory;
            filteredBugs.set(bugs);

            const toDoBugs = bugsWithCategory.filter(bug => bug.category === "To Do");
            for (const bug of toDoBugs) {
                await checkForInProgress(bug);
            }

            const inProgressBugs = bugsWithCategory.filter(bug => bug.category === 'In Progress');
            for (const bug of inProgressBugs) {
                await checkForInReview(bug.id);
            }

            const inReviewBugs = bugsWithCategory.filter(bug => bug.category === "In Review");
            for (const bug of inReviewBugs) {
                await checkForDone(bug);
            }

            categorizedBugs = categorizeBugs();
            categoryTotals = calculateCategoryTotals();
        } catch (err) {
            error.set('Failed to fetch bug list details');
        } finally {
            loading.set(false);
        }
    };

    const checkForInProgress = async (bug) => {
        try {
            if (bug.assigned_to_detail?.email !== "nobody@mozilla.org") {
                const newCategory = 'In Progress';
                await updateBugCategory(bug.id, newCategory);
                notification.set(`Bug ID ${bug.id} category updated to In Progress.`);
                notificationType.set('success');
            }
            
        } catch (err) {
                console.error(`Failed to update category to In Review for Bug ID ${bug.id}:`, err);
                notification.set(`Failed to update category for Bug ID ${bug.id}.`);
                notificationType.set('error');
        }
    }

    const checkForInReview = async (bugId) => {
        try {
            const bugHasReview = await hasReviewAttachment(bugId);

            if (bugHasReview) {
                const newCategory = 'In Review';
                await updateBugCategory(bugId, newCategory);
                notification.set('Bug category updated successfully.');
                notificationType.set('success');
            }
        } catch (err) {
            console.error(`Failed to update bug with ID ${bugId}:`, err);
            error.set(`Failed to update bug with ID ${bugId}`);
            notification.set('Failed to update In Progress Bugs');
            notificationType.set('error');
        }
    };

    const checkForDone = async (bug) => {
        if (bug.resolution && bug.resolution.trim() !== '') {
            try {
                await updateBugCategory(bug.id, 'Done');
                notification.set(`Bug ID ${bug.id} category updated to Done.`);
                notificationType.set('success');
            } catch (err) {
                console.error(`Failed to update category to Done for Bug ID ${bug.id}:`, err);
                notification.set(`Failed to update category for Bug ID ${bug.id}.`);
                notificationType.set('error');
            }
        }
    };

    const updateBugCategory = async (bugId, newCategory) => {
        if (!newCategory) {
            console.error('No category provided for updateBugCategory');
            return;
        }

        loading.set(true);
        try {
            const response = await fetch(`/teams/${teamId}/sprints/${sprintId}/bugs/${bugId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ teamId, sprintId, bugId, newCategory }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update bug category: ${errorText}`);
            }
            const updatedBug = await response.json();
            bugs = bugs.map(bug => bug.id === bugId ? { ...bug, category: newCategory } : bug);
            filteredBugs.set(bugs);
            setLocalStorage(`${teamId}-${sprintId}-bugs`, bugs);
            notification.set('Bug category updated successfully.');
            notificationType.set('success');

            categorizedBugs = categorizeBugs();
            categoryTotals = calculateCategoryTotals();
        } catch (err) {
            notification.set('Failed to update bug category.');
            notificationType.set('error');
        } finally {
            loading.set(false);
        }
    };

    const toggleSelectAll = (category) => {
        const currentChecked = get(checkedBugIdsByCategory)[category];
        const categoryBugs = categorizedBugs[category] || [];

        checkedBugIdsByCategory.update((ids) => {
            const updatedIds = { ...ids };
            updatedIds[category] = currentChecked.length === categoryBugs.length ? [] : categoryBugs.map(bug => bug.id);
            return updatedIds;
        });
    };

    const handleCheckboxChange = (bugId, category) => {
        checkedBugIdsByCategory.update((ids) => {
            const updatedIds = { ...ids };
            if (updatedIds[category].includes(bugId)) {
                updatedIds[category] = updatedIds[category].filter(id => id !== bugId);
            } else {
                updatedIds[category] = [...updatedIds[category], bugId];
            }
            return updatedIds;
        });
    };

    const unselectAllBugs = () => {
        checkedBugIdsByCategory.set(initializeBugs());
    };

    const navigateToSprints = () => {
        goto(`/teams/${teamId}`);
    };

    const sortBugs = (key) => {
        sortConfig.update(currentConfig => {
            let direction = 'asc';
            if (currentConfig.key === key && currentConfig.direction === 'asc') {
                direction = 'desc';
            }
            return { key, direction };
        });

        filteredBugs.update(currentBugs => {
            return currentBugs.slice().sort((a, b) => {
                const sortDirection = get(sortConfig).direction;

                let aValue = a[key];
                let bValue = b[key];

                if (key === 'assigned_to_detail') {
                    aValue = a.assigned_to_detail?.email || '';
                    bValue = b.assigned_to_detail?.email || '';
                }

                if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        });

        categorizedBugs = categorizeBugs();
        categoryTotals = calculateCategoryTotals();
    };

    const addBugToSprint = async () => {
        const bugId = Number(get(newBugId).trim());

        if (!bugId) {
            notification.set('Please enter a valid Bug ID.');
            notificationType.set('error');
            return;
        }

        try {
            loading.set(true);

            const bugIds = [bugId];

            const response = await fetch(`/teams/${teamId}/sprints/${sprintId}/addbugs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bugIds }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to add bug: ${errorText}`);
            }

            const addedSprintData = await response.json();

            const fetchedBugs = await getBugsDetails([bugId]);

            const bugsWithCategory = await Promise.all(fetchedBugs.map(async (bug) => {
                let category = statusToCategory[bug.status] || 'To Do';

                if (!validCategories.includes(category)) {
                    category = statusToCategory[bug.status] || 'To Do';
                    try {
                        await updateBugCategory(bug.id, category);
                    } catch (updateError) {
                        console.error(`Failed to update bug category in database for Bug ID ${bug.id}:`, updateError);
                    }
                }

                return {
                    ...bug,
                    category,
                };
            }));

            bugs = [...bugs, ...bugsWithCategory];
            filteredBugs.set(bugs);
            setLocalStorage(`${teamId}-${sprintId}-bugs`, bugs);

            categorizedBugs = categorizeBugs();
            categoryTotals = calculateCategoryTotals();

            notification.set(`Bug ID ${bugId} added successfully.`);
            notificationType.set('success');
            newBugId.set('');
        } catch (err) {
            notification.set(`Failed to add Bug ID ${bugId}.`);
            notificationType.set('error');
        } finally {
            loading.set(false);
        }
    };

    const removeSelectedBugs = async () => {
        const selectedBugIds = Object.values(get(checkedBugIdsByCategory)).flat();

        if (selectedBugIds.length === 0) {
            notification.set('No bugs selected for removal.');
            notificationType.set('error');
            return;
        }

        try {
            loading.set(true);

            const response = await fetch(`/teams/${teamId}/sprints/${sprintId}/removebugs`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bugIds: selectedBugIds }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to remove bugs: ${errorText}`);
            }

            notification.set('Selected bugs removed successfully.');
            notificationType.set('success');

            bugs = bugs.filter(bug => !selectedBugIds.includes(bug.id));
            filteredBugs.set(bugs);
            setLocalStorage(`${teamId}-${sprintId}-bugs`, bugs);

            categorizedBugs = categorizeBugs();
            categoryTotals = calculateCategoryTotals();

            unselectAllBugs();
        } catch (err) {
            notification.set('Failed to remove selected bugs.');
            notificationType.set('error');
            console.error('Error removing selected bugs:', err);
        } finally {
            loading.set(false);
        }
    };

    const toggleExpand = () => {
        isExpanded.update(expanded => !expanded);
    };
</script>

<style src="../../../../../styles/styles.css"></style>

<div class="container {$updating ? 'disabled' : ''}">
    {#if $error}
        <p class="error">{$error}</p>
    {/if}

    <button class="selection-button" on:click={navigateToSprints}>Back To Sprints</button>

    <h1>Bug List for Sprint: {$sprintName}</h1>

    <div class="update-whiteboard-container">
        <div class="selection-buttons-row">
            <button
                class="selection-button"
                on:click={unselectAllBugs}>
                Unselect All
            </button>
            <button
                class="selection-button"
                on:click={removeSelectedBugs}
                disabled={Object.values($checkedBugIdsByCategory).flat().length === 0}>
                Remove Selected Bugs
            </button>
        </div>

        <p class="selected-bugs-info">
            {#if Object.values($checkedBugIdsByCategory).flat().length === 0}
                No tickets selected.
            {:else if Object.values($checkedBugIdsByCategory).flat().length === 1}
                1 ticket selected.
            {:else}
                {Object.values($checkedBugIdsByCategory).flat().length} tickets selected.
            {/if}
        </p>

        <div class="rollover-container">
            <select bind:value={$selectedSprint}>
                <option value="" disabled>Select Sprint</option>
                {#each $availableSprints as sprint}
                    <option value={sprint.id}>{sprint.name}</option>
                {/each}
            </select>
            <button on:click={rollOverBugsToSprint} disabled={$loading || !$selectedSprint}>
                Roll Over Selected Bugs
            </button>
        </div>

        <div class="add-bug-container">
            <input
                type="text"
                placeholder="Enter Bug ID"
                bind:value={$newBugId}
                class="bug-id-input"
            />
            <button on:click={addBugToSprint} disabled={$loading || !$newBugId.trim()}>
                Add Bug
            </button>
        </div>
    </div>

    {#if $notification}
        <div class="notification-banner {$notificationType}">
            <span>{$notification}</span>
        </div>
    {/if}

    {#if $loading && !$filteredBugs.length}
        <p class="loading">Loading...</p>
    {/if}

    {#if $filteredBugs.length > 0}
        <div class="progress-bar-container" role="progressbar" aria-valuemin="0" aria-valuemax="100">
            {#each Object.entries(categoryTotals) as [category, count]}
                {#if count > 0}
                    <div
                        class="progress-segment"
                        tabindex="0"
                        style="width: {count / $filteredBugs.length * 100}%; background-color: {categoryColors[category] || '#ccc'}"
                        aria-label="{category} ({count} tickets, {(count / $filteredBugs.length * 100).toFixed(1)}%)"
                        role="button"
                    >
                        {category} ({count})
                    </div>
                {/if}
            {/each}
        </div>

        <div class="tooltip-container">
            <button on:click={toggleExpand}>
                Click for more info
            </button>
            <div class="tooltip-text">
                Information about the Auto-Sorted Current Categories
                <div class={`expandable-area ${$isExpanded ? 'expanded' : ''}`}>
                    <p>To Do: unassigned tickets</p>
                    <p>In Progress: assigned tickets with no patch</p>
                    <p>In Review: tickets with patches</p>
                    <p>Done: completed tickets with landed patches</p>
                </div>
            </div>
        </div>

        {#each categories as { key, label }}
            {#if categorizedBugs[key] && categorizedBugs[key].length > 0}
                <h2>{label}</h2>
                <table class="bug-table">
                    <thead>
                        <tr>
                            <th>
                                Bulk Edit
                                <button
                                    class="selection-button {($checkedBugIdsByCategory[key] || []).length === categorizedBugs[key].length ? 'active' : ''}"
                                    on:click={() => toggleSelectAll(key)}>
                                    {($checkedBugIdsByCategory[key] || []).length === categorizedBugs[key].length ? 'Deselect All' : 'Select All'}
                                </button>
                            </th>
                            <th class="sortable" on:click={() => sortBugs('id')}>
                                ID
                                {#if $sortConfig.key === 'id'}
                                    <span>{$sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                {/if}
                            </th>
                            <th class="sortable" on:click={() => sortBugs('summary')}>
                                Summary
                                {#if $sortConfig.key === 'summary'}
                                    <span>{$sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                {/if}
                            </th>
                            <th class="sortable" on:click={() => sortBugs('component')}>
                                Component
                                {#if $sortConfig.key === 'component'}
                                    <span>{$sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                {/if}
                            </th>
                            <th class="sortable" on:click={() => sortBugs('assigned_to_detail')}>
                                Assigned to
                                {#if $sortConfig.key === 'assigned_to_detail'}
                                    <span>{$sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                                {/if}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each categorizedBugs[key] as bug}
                            <tr>
                                <td>
                                    <button
                                        class="selection-button {($checkedBugIdsByCategory[key] || []).includes(bug.id) ? 'active' : ''}"
                                        on:click={() => handleCheckboxChange(bug.id, key)}>
                                        {($checkedBugIdsByCategory[key] || []).includes(bug.id) ? 'Deselect' : 'Select'}
                                    </button>
                                </td>
                                <td><a href={`/bugs/${bug.id}`}>{bug.id}</a></td>
                                <td>{bug.summary}</td>
                                <td>{bug.component}</td>
                                <td>{bug.assigned_to_detail?.real_name || bug.assigned_to_detail?.email}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/if}
        {/each}
    {:else if !$loading && !$filteredBugs.length}
        <p class="no-bugs">No bugs found for this sprint.</p>
    {/if}
</div>
