<script>
    export let bugs = [];
    export let statusList = ['NEW', 'ASSIGNED', 'RESOLVED', 'VERIFIED'];
    export let statusColors = {
      NEW: '#f8d7da',
      ASSIGNED: '#e2e3ff',
      RESOLVED: '#d4edda',
      VERIFIED: '#cce5ff'
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
  </script>
  
  <style>
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
  </style>
  
  <div class="progress-bar-container" role="progressbar" aria-valuemin="0" aria-valuemax="100">
    {#each calculateStatusTotals() as { status, percentage, count }}
      {#if percentage > 0}
        <div
          class="progress-segment"
          tabindex="0"
          style="width: {percentage}%; background-color: {statusColors[status]}"
          aria-label="{status} ({count} tickets, {percentage.toFixed(1)}%)"
          role="button"
        >
          {status} ({count})
        </div>
      {/if}
    {/each}
  </div>
  