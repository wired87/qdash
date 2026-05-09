/**
 * rtdbUserManager.js
 *
 * Low-level helpers for persisting user-owned entities in Firebase RTDB
 * under the path:  users/{uid}/{collection}/{id}
 *
 * Supported collections:
 *   envs | fields | modules | injections | methods | sessions
 *
 * All functions accept a live `database` instance (getDatabase) and the
 * Firebase UID of the authenticated user.
 */

import {
  ref,
  set,
  remove,
  onValue,
} from 'firebase/database';

/**
 * Sanitise a value for RTDB: removes undefined fields (RTDB rejects them).
 */
const sanitise = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Build the RTDB path for an entity.
 * users/{uid}/{collection}/{id}
 */
const entityPath = (uid, collection, id) =>
  `users/${uid}/${collection}/${id}`;

/**
 * Save (upsert) a single entity.
 * @param {Database} db   Firebase Realtime Database instance
 * @param {string}   uid  Firebase Auth UID
 * @param {string}   collection   e.g. 'envs', 'fields', 'modules', …
 * @param {string}   id   Entity ID (used as the RTDB key)
 * @param {object}   data Entity data object
 */
export const saveEntity = async (db, uid, collection, id, data) => {
  if (!db || !uid || !id || !data) return;
  const entityRef = ref(db, entityPath(uid, collection, id));
  await set(entityRef, sanitise(data));
};

/**
 * Delete a single entity from RTDB.
 */
export const deleteEntity = async (db, uid, collection, id) => {
  if (!db || !uid || !id) return;
  const entityRef = ref(db, entityPath(uid, collection, id));
  await remove(entityRef);
};

/**
 * Save an entire collection at once (replaces existing data).
 * @param {Database}  db
 * @param {string}    uid
 * @param {string}    collection
 * @param {Array|object} items  Array of objects with `.id` field, or keyed object
 */
export const saveCollection = async (db, uid, collection, items) => {
  if (!db || !uid) return;
  const list = Array.isArray(items) ? items : Object.values(items);
  const writes = list
    .filter(Boolean)
    .map((item) => {
      const id = item.id || item.env_id || item.nid;
      if (!id) return Promise.resolve();
      return saveEntity(db, uid, collection, id, item);
    });
  await Promise.all(writes);
};

/**
 * Attach a live `onValue` listener to a collection.
 *
 * @param {Database}  db
 * @param {string}    uid
 * @param {string}    collection
 * @param {function}  onData  Called with Array of entity objects whenever data changes
 * @returns {function} unsubscribe – call to detach the listener
 */
export const listenEntities = (db, uid, collection, onData) => {
  if (!db || !uid || !onData) return () => {};
  const collectionRef = ref(db, `users/${uid}/${collection}`);
  const unsubscribe = onValue(collectionRef, (snapshot) => {
    const val = snapshot.val();
    if (!val) {
      onData([]);
      return;
    }
    // RTDB returns an object keyed by entity id → convert to array
    const arr = Object.entries(val).map(([id, data]) => ({
      id,
      ...data,
    }));
    onData(arr);
  });
  return unsubscribe;
};
