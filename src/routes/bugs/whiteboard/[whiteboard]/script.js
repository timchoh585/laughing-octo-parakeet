import { onMount } from 'svelte';
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { searchWhiteboard, getBug, updateBug } from '../../../../api/api';
import { writable, get } from 'svelte/store';
import { whiteboardBugCache } from '../../../../stores/bugStore';

export let selectedStatus = writable('');
export let selectedAssignee = writable('');
export let selectedPriority = writable('');
export let newBugId = writable('');
export let sprintName = writable('');
export let whiteboardField = writable('');

let bugs = [];
let filteredBugs = [];
let error = writable(null);
let loading = writable(false);
let newWhiteboard = writable('');
let bugId = writable('');
let appendString = writable('');
let notification = writable('');
let notificationType = writable(''); // success or error
let updating = writable(false); // To track the updating state

let whiteboard;
$page.subscribe(($page) => {
    whiteboard = $page.params.whiteboard;
});

const statusColors = {
  NEW: '#f8d7da',
  ASSIGNED: '#e2e3ff',
  RESOLVED: '#d4edda',
  VERIFIED: '#cce5ff'
};

const statusList = ['NEW', 'ASSIGNED', 'RESOLVED', 'VERIFIED'];

const fetchBugsByWhiteboard = async (whiteboard) => {
  const cachedBugs = get(whiteboardBugCache)[whiteboard];

  if (cachedBugs) {
    bugs = cachedBugs;
    filteredBugs = cachedBugs;
  } else {
    loading.set(true);
  }

  try {
    const data = await searchWhiteboard(whiteboard);
    const fetchedBugs = data.bugs;

    if (JSON.stringify(cachedBugs) !== JSON.stringify(fetchedBugs)) {
      bugs = fetchedBugs;
      filteredBugs = fetchedBugs;
      whiteboardBugCache.update(cache => ({ ...cache, [whiteboard]: fetchedBugs }));
    }
    
    error.set(null);
  } catch (err) {
    console.error('Failed to fetch bugs:', err);
    error.set('Failed to fetch bugs');
  } finally {
    loading.set(false);
  }
};

const handleWhiteboardSearch = () => {
  const whiteboardValue = get(newWhiteboard).trim();
  if (whiteboardValue) {
    goto(`/bugs/whiteboard/${encodeURIComponent(whiteboardValue)}`);
  } else {
    alert('Please enter a valid whiteboard');
  }
};

const handleKeyPress = (event) => {
  if (event.key === 'Enter') {
    handleWhiteboardSearch();
  }
};

const handleFilterChange = () => {
  filteredBugs = bugs.filter(bug => {
    const matchesStatus = !get(selectedStatus) || bug.status === get(selectedStatus);
    const matchesAssignee = !get(selectedAssignee) || 
      (bug.assigned_to_detail?.real_name || bug.assigned_to_detail?.email) === get(selectedAssignee);
    const matchesPriority = !get(selectedPriority) || bug.priority === get(selectedPriority);
    return matchesStatus && matchesAssignee && matchesPriority;
  });
};

const handleAddBug = () => {
  const id = parseInt(get(bugId), 10);
  if (!isNaN(id) && id > 0) {
    goto(`/bugs/whiteboard/addbug/${id}`);
  } else {
    alert('Please enter a valid bug ID');
  }
};

const calculateStatusTotals = () => {
  const totals = statusList.reduce((acc, status) => {
    acc[status] = bugs.filter(bug => bug.status === status).length;
    return acc;
  }, {});

  const totalBugs = bugs.length;
  const progress = statusList.map(status => ({
    status,
    count: totals[status],
    percentage: (totals[status] / totalBugs) * 100
  }));

  return progress;
};

let previousStatus = '';

const handleStatusClick = (status) => {
  if (get(selectedStatus) === status) {
    if (previousStatus === status) {
      // Second click, reset the filter
      selectedStatus.set('');
      previousStatus = '';
    } else {
      // First click, apply the filter
      previousStatus = status;
    }
  } else {
    // Different filter clicked, apply the filter
    selectedStatus.set(status);
    previousStatus = status;
  }
  handleFilterChange(); // Reapply the filter logic
};

const updateBugsWhiteboard = async () => {
  updating.set(true);
  try {
    const bugsToUpdate = get(selectedStatus) ? filteredBugs : bugs;
    for (const bug of bugsToUpdate) {
      const updatedWhiteboard = `${bug.whiteboard} ${get(appendString)}`.trim();
      await updateBug(bug.id, { whiteboard: updatedWhiteboard });
    }
    notification.set('The tickets were updated successfully.');
    notificationType.set('success');
  } catch (err) {
    console.error('Failed to update bugs:', err);
    notification.set('Failed to update bugs.');
    notificationType.set('error');
  } finally {
    updating.set(false);
  }

  setTimeout(() => {
    notification.set('');
  }, 5000);
};

onMount(() => {
  fetchBugsByWhiteboard(whiteboard);
  sprintName.set('[' + whiteboard + ']');
});

$: if (whiteboard) {
  fetchBugsByWhiteboard(whiteboard);
};

const quickAddBug = async () => {
    const id = parseInt(get(newBugId), 10);
    if (!isNaN(id) && id > 0) {
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
            whiteboard: get(whiteboardField) + get(sprintName)
        };
        await updateBug(get(newBugId), updatedBugData);
        fetchBugsByWhiteboard(get(sprintName));
    } catch (err) {
        console.error('Failed to update bug:', err);
        alert('Please enter a valid bug ID');
    }
};
