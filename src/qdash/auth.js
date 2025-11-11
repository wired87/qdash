// Name of the key used for local persistence
export const USER_ID_KEY = 'QDASH_USER_ID';

/**
 * Generates a persistent, unique user ID for the current browser instance.
 * It checks local storage and creates a new ID if none is found.
 * @returns {string} The persistent user ID.
 */
export const getOrCreateUserId = () => {
  // 1. Try to retrieve the existing ID from persistent local storage
  let userId = localStorage.getItem(USER_ID_KEY);

  // 2. If no ID is found, create a new one
  if (!userId) {
    // Generate a new unique ID (UUID format, with dashes removed for simplicity)
    userId = crypto.randomUUID().replace(/-/g, '');

    // 3. Save the newly created ID persistently to the browser's local storage
    localStorage.setItem(USER_ID_KEY, userId);

    console.log(`[QDash] New user ID created and stored: ${userId}`);
  } else {
    console.log(`[QDash] Existing user ID retrieved: ${userId}`);
  }

  return userId;
};
