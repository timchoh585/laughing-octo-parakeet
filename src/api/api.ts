import CryptoJS from 'crypto-js';

const API_BASE_URL = 'https://bugzilla.mozilla.org/rest';
let encryptedTokenKey = 'encrypted_token';

// --------------- Utility Functions ---------------

const encrypt = (data: string, secret: string): string => {
  return CryptoJS.AES.encrypt(data, secret).toString();
};

const decrypt = (data: string, secret: string): string => {
  const bytes = CryptoJS.AES.decrypt(data, secret);
  return bytes.toString(CryptoJS.enc.Utf8);
};

const getSecretKey = (): string => {
  const secret = import.meta.env.VITE_SECRET_KEY;
  if (!secret) throw new Error('Secret key is not defined');
  return secret;
};

const setToken = (token: string) => {
  const secret = getSecretKey();
  const encryptedToken = encrypt(token, secret);
  localStorage.setItem(encryptedTokenKey, encryptedToken);
};

const getToken = (): string | null => {
  const secret = getSecretKey();
  const encryptedToken = localStorage.getItem(encryptedTokenKey);
  if (!encryptedToken) return null;
  return decrypt(encryptedToken, secret);
};

const removeToken = () => {
  localStorage.removeItem(encryptedTokenKey);
};

export { getToken, removeToken };

const appendApiKey = (url: string): string => {
  const token = getToken();
  if (!token) throw new Error('API key is not available');
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}api_key=${encodeURIComponent(token)}`;
};

// Utility function to ensure bugId is a valid number
function validateBugId(bugId: any): number {
  const id = Number(bugId);
  if (isNaN(id) || !Number.isInteger(id)) {
    throw new Error('bugId must be an integer');
  }
  return id;
}

// Utility function to ensure attachmentId is a valid number
function validateAttachmentId(attachmentId: any): number {
  const id = Number(attachmentId);
  if (isNaN(id) || !Number.isInteger(id)) {
    throw new Error('attachmentId must be an integer');
  }
  return id;
}

// Utility function to ensure the query is a string
function validateQuery(query: any): string {
  if (typeof query !== 'string' || query.trim() === '') {
    throw new Error('Query must be a non-empty string');
  }
  return query.trim();
}

// Utility function to ensure commentId is a valid number
function validateCommentId(commentId: any): number {
  const id = Number(commentId);
  if (isNaN(id) || !Number.isInteger(id)) {
    throw new Error('commentId must be an integer');
  }
  return id;
}

// Utility function to ensure componentId is a valid number
function validateComponentId(componentId: any): number {
  const id = Number(componentId);
  if (isNaN(id) || !Number.isInteger(id)) {
    throw new Error('componentId must be an integer');
  }
  return id;
}

// Utility function to ensure productId is a valid number
function validateProductId(productId: any): number {
  const id = Number(productId);
  if (isNaN(id) || !Number.isInteger(id)) {
    throw new Error('productId must be an integer');
  }
  return id;
}

// --------------- User ---------------

export const loginWithApiKey = async (apiKey: string): Promise<void> => {
  try {
    setToken(apiKey);
  } catch (error) {
    console.error('Error setting API key:', error);
    throw error;
  }
};

// DEPRICATED
export const login = async (username: string, password: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/login?login=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    const token = data.token;

    setToken(token);
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// --------------- Attachments ---------------

// Fetch attachments for a given bug ID
export async function getAttachments(bugId: number): Promise<any> {
  bugId = validateBugId(bugId);
  const response = await fetch(`${API_BASE_URL}/bug/${bugId}/attachment`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// Create attachment for a given bug ID
export async function createAttachment(bugId: number, attachmentData: any): Promise<any> {
  bugId = validateBugId(bugId);
  const response = await fetch(`${API_BASE_URL}/bug/${bugId}/attachment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(attachmentData)
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// Update attachment for a given attachment ID
export async function updateAttachment(attachmentId: number, attachmentData: any): Promise<any> {
  attachmentId = validateAttachmentId(attachmentId);
  const response = await fetch(`${API_BASE_URL}/attachment/${attachmentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(attachmentData)
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// --------------- Bugs ---------------

// // Fetch bug details for a given bug ID
// export async function getBug(bugId: number): Promise<any> {
//   bugId = validateBugId(bugId);
//   const response = await fetch(`${API_BASE_URL}/bug/${bugId}`);
//   if (!response.ok) {
//     throw new Error('Network response was not ok');
//   }
//   const data = await response.json();
//   return data.bugs[0]; // Assuming the API returns an array of bugs
// }

// Fetch bug details for a given bug ID
export async function getBug(bugId: number): Promise<any> {
  bugId = validateBugId(bugId);
  const url = `${API_BASE_URL}/bug/${bugId}`;
  console.log('Fetching bug details from URL:', url);  // Log the URL being requested

  const response = await fetch(url);
  console.log('Response status:', response.status);  // Log the response status

  if (!response.ok) {
    console.error('Network response was not ok:', response.statusText);  // Log the error status
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Response data:', data);  // Log the response data
  return data.bugs[0];  // Assuming the API returns an array of bugs
}

// Function to fetch bugs for a specific product and component
export async function getBugs(productName: string, componentName: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/bug?
    product=${encodeURIComponent(productName)}
    &component=${encodeURIComponent(componentName)}
    &limit=50`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// List all bugs
export async function listBugs(): Promise<any> {
  const url = `${API_BASE_URL}/bug?product=Fenix&component=Autofill&resolution=---`;
  console.log('Fetching bug list from URL:', url);  // Log the URL being requested

  const response = await fetch(url);
  console.log('Response status:', response.status);  // Log the response status

  if (!response.ok) {
    console.error('Network response was not ok:', response.statusText);  // Log the error status
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Response data:', data);  // Log the response data
  return data;  // Assuming the API returns a list of bugs
}

// Fetch bug history for a given bug ID
export async function getBugHistory(bugId: number): Promise<any> {
  bugId = validateBugId(bugId);
  const response = await fetch(`${API_BASE_URL}/bug/${bugId}/history`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// Search for bugs based on a query
export async function searchBugs(query: string): Promise<any> {
  query = validateQuery(query);
  const response = await fetch(`${API_BASE_URL}/bug?quicksearch=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// Search for bugs based on a query
export async function searchWhiteboard(query: string): Promise<any> {
  query = validateQuery(query);
  const response = await fetch(`${API_BASE_URL}/bug?whiteboard=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// Create a new bug with the provided data
export async function createBug(bugData: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/bug`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bugData)
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// Update bug
export const updateBug = async (bugId: number, updatedBugData: any): Promise<any> => {
  const url = appendApiKey(`${API_BASE_URL}/bug/${bugId}`);
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedBugData)
  });

  if (!response.ok) {
    throw new Error('Failed to update bug');
  }

  const data = await response.json();
  return data;
};

// Fetch bug graph data
export async function getBugGraphData(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/bug/graph`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// Fetch possible duplicates for a given bug ID
export async function getPossibleDuplicates(bugId: number): Promise<any> {
  bugId = validateBugId(bugId);
  const response = await fetch(`${API_BASE_URL}/bug/${bugId}/duplicates`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// Fetch bug fields
export async function getBugFields(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/bug/fields`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// Fetch bugs assigned to a specific email
export async function getAssignedBugsByEmail(email: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/bug?` +
    'include_fields=id,summary,last_change_time,cf_fx_iteration,whiteboard,keywords,type,status,flags&' +
    'resolution=---&order=changeddate DESC&' +
    'f1=assigned_to&' +
    'limit=50&' +
    'o1=equals&' +
    `v1=${encodeURIComponent(email)}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data.bugs;
}

// Fetch bugs assigned to a specific email
export async function getFlaggedBugsByEmail(email: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/bug?` +
    'include_fields=id%2Csummary%2Clast_change_time%2Ccf_fx_iteration%2Cwhiteboard%2Ckeywords%2Ctype%2Cstatus%2Cflags&resolution=---&' +
    'order=changeddate%20DESC&' +
    'f1=requestees.login_name&' +
    'o1=equals&' +
    `v1=${encodeURIComponent(email)}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data.bugs;
}

// Fetch bugs assigned to a specific email
export async function getRecentCommentedBugsByEmail(email: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/bug?` +
    'include_fields=id%2Csummary%2Clast_change_time%2Ccf_fx_iteration%2Cwhiteboard%2Ckeywords%2Ctype%2Cstatus%2Cflags&' +
    'order=changeddate%20DESC&' +
    'limit=30&' +
    'f1=commenter&' +
    'o1=equals&' +
    `v1=${encodeURIComponent(email)}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data.bugs;
}

// Fetch bugs assigned to a specific email
export async function getRecentlyClosedBugsByEmail(email: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/bug?` +
    'include_fields=id%2Csummary%2Clast_change_time%2Ccf_fx_iteration%2Cwhiteboard%2Ckeywords%2Ctype%2Cstatus%2Cflags&order=changeddate%20DESC&' +
    'limit=50&' +
    'resolution=FIXED&' + 
    'f1=assigned_to&' +
    'o1=equals&' +
    `v1=${encodeURIComponent(email)}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data.bugs;
}

// --------------- Comments ---------------

// Create a new comment for a given bug ID
export async function createComment(bugId: number, comment: string): Promise<any> {
  bugId = validateBugId(bugId);
  const response = await fetch(`${API_BASE_URL}/bug/${bugId}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ comment })
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// Fetch comments for a given bug ID
export async function getComments(bugId: number): Promise<any> {
  bugId = validateBugId(bugId);
  const response = await fetch(`${API_BASE_URL}/bug/${bugId}/comment`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// Search for comment tags based on a query
export async function searchCommentTags(query: string): Promise<any> {
  query = validateQuery(query);
  const response = await fetch(`${API_BASE_URL}/comment/tags?search=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// Update comment tags for a given comment ID
export async function updateCommentTags(commentId: number, tagData: any): Promise<any> {
  commentId = validateCommentId(commentId);
  const response = await fetch(`${API_BASE_URL}/comment/${commentId}/tags`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tagData)
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// --------------- Components ---------------

// Fetch component details for a given product ID and component ID
export async function getComponent(productName: string, componentName: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/component/${productName}/${componentName}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data; // Assuming the API returns an array of components
}

// Create a new component with the provided data
export async function createComponent(componentData: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/component`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(componentData)
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// Update component details for a given component ID
export async function updateComponent(componentId: number, updatedComponentData: any): Promise<any> {
  componentId = validateComponentId(componentId);
  const response = await fetch(`${API_BASE_URL}/component/${componentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedComponentData)
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// --------------- Products ---------------

// Fetch product details for a given product Name
export async function getProduct(productName: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/product/${productName}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data.products[0];
}

// Search for products by name
export async function searchProductsByName(query: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/product?name=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data.products; // Assuming the API returns an array of products
}

// Fetch the list of products
export async function listProducts(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/product`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data.ids.map(Number);
}

// Fetch the list of selectable products
export async function listSelectableProducts(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/product_selectable`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data.ids.map(Number);
}

// Create a new product with the provided data
export async function createProduct(productData: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/product`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}

// Update product details for a given product ID
export async function updateProduct(productId: number, updatedProductData: any): Promise<any> {
  productId = validateProductId(productId);
  const response = await fetch(`${API_BASE_URL}/product/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedProductData)
  });
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data;
}
