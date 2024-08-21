<script>
    import { goto } from '$app/navigation';
  
    export let bugId;
    export let bugDetails;
    export let onClose;
  
    const handleEdit = () => {
      goto(`/bugs/edit/${bugId}`);
    };
  </script>
  
  <style>
    .popup-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
  
    .popup-content {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      z-index: 1001;
    }
  
    .close-button {
      text-align: right;
      margin-bottom: 1rem;
    }
  
    .close-button button {
      background: none;
      border: none;
      color: #343a40;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      transition: color 0.3s;
    }
  
    .close-button button:hover {
      color: #007bff;
    }
  
    .edit-button {
      display: flex;
      justify-content: center;
      margin-top: 2rem;
    }
  
    .edit-button button {
      padding: 0.75rem 1.5rem;
      background: #007bff;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.3s, transform 0.3s;
    }
  
    .edit-button button:hover {
      background: #0056b3;
      transform: translateY(-2px);
    }
  
    .edit-button button:active {
      transform: translateY(0);
    }
  </style>
  
  <div 
    class="popup-container" 
    role="dialog" 
    aria-modal="true" 
    tabindex="0"
    on:click={onClose}>
    <div class="popup-content" on:click|stopPropagation>
      <div class="close-button">
        <button on:click={onClose} aria-label="Close popup">&times;</button>
      </div>
      <h2>Bug Details: {bugId}</h2>
      <p><strong>Summary:</strong> {bugDetails.summary}</p>
      <p><strong>Status:</strong> {bugDetails.status}</p>
      <p><strong>Resolution:</strong> {bugDetails.resolution}</p>
      <p><strong>Severity:</strong> {bugDetails.severity}</p>
      <p><strong>Priority:</strong> {bugDetails.priority}</p>
      <p><strong>Assigned to:</strong> {bugDetails.assigned_to_detail.real_name} ({bugDetails.assigned_to_detail.email})</p>
      <p><strong>Created on:</strong> {new Date(bugDetails.creation_time).toLocaleDateString()}</p>
      <p><strong>Last modified:</strong> {new Date(bugDetails.last_change_time).toLocaleDateString()}</p>
      <p><strong>Whiteboard:</strong> {bugDetails.whiteboard}</p>
      <p><strong>Bugzilla Link:</strong> <a href="https://bugzilla.mozilla.org/show_bug.cgi?id={bugId}" target="_blank">View on Bugzilla</a></p>
  
      <div class="edit-button">
        <button on:click={handleEdit}>Edit Bug</button>
      </div>
    </div>
  </div>
  