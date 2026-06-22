/** Current signed-in user id, shared by the data store + API client. */
let currentUserId = 'demo-user';

export function setCurrentUserId(id) {
  currentUserId = id || 'demo-user';
}

export function getCurrentUserId() {
  return currentUserId;
}
