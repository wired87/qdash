# Redux Data Structure (redux_ds.md)

This document provides a summary of all data structures managed within the project's Redux store. The store is divided into slices. **All session-specific data has been consolidated within the `sessions` slice** to ensure a clean separation between user-owned resources (buckets/pools) and the active session's configuration context.

## 1. Sessions (`sessions`)
**File:** `src/qdash/store/slices/sessionSlice.js`

Manages user sessions and **all data related to the currently active session**.

| Field | Type | Description |
| :--- | :--- | :--- |
| `sessions` | `Array<Object>` | List of session objects belonging to the user. |
| `activeSessionId` | `string \| null` | The ID of the currently selected/active session. |
| `activeSession` | `Object \| null` | The full object of the currently active session. |
| **`activeSessionEnvs`** | `Array<Object>` | **Moved from Envs.** List of environment objects explicitly linked to the active session. |
| **`activeSessionModules`** | `Array<string \| Object>` | **Moved from Modules.** List of modules linked to the active session. |
| **`activeSessionFields`** | `Array<Object>` | **Moved from Fields.** List of fields available in the active session context (derived from linked modules). |
| **`activeSessionConfig`** | `Object` | The configuration draft for the active session. Structure: `{ envs: { [envId]: { modules: { [modId]: { fields: { [fieldId]: { injections: { [pos]: "injId" } } } } } } } }`. |
| `loading` | `boolean` | Indicates if session data is being fetched. |
| `error` | `any \| null` | Error state. |

---

## 2. Environments (`envs`)
**File:** `src/qdash/store/slices/envSlice.js`

Manages the global pool of environments owned by the user.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userEnvs` | `Array<Object>` | List of all environment objects owned by the user. Available to be linked to sessions. |
| `loading` | `boolean` | Fetching state. |

---

## 3. Modules (`modules`)
**File:** `src/qdash/store/slices/moduleSlice.js`

Manages the global pool of modules available to the user.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userModules` | `Array<string \| Object>` | List of modules available to the user. Available to be linked to sessions. |
| `loading` | `boolean` | Fetching state. |

---

## 4. Fields (`fields`)
**File:** `src/qdash/store/slices/fieldSlice.js`

Manages global field definitions and their patterns.

| Field | Type | Description |
| :--- | :--- | :--- |
| Field | Type | Description |
| :--- | :--- | :--- |
| `userFields` | `Array<FieldType>` | Global list of field definitions available to the user. See `FieldType` below. |
| `fieldInteractions` | `Array<FieldToFieldType>` | List of defined interactions between fields. |
| `moduleFields` | `Array<ModuleToFieldType>` | Links between modules and fields. |
| `loading` | `boolean` | Fetching state. |

### Data Structures

**FieldType**
```json
{
    "id": "STRING",
    "params": "JSON",
    "module": "STRING",
    "user_id": "STRING"
}
```

**FieldToFieldType** (Interactions)
```json
{
    "id": "STRING",
    "field_id": "STRING",
    "interactant_field_id": "STRING",
    "user_id": "STRING"
}
```

**ModuleToFieldType**
```json
{
    "id": "STRING",
    "module_id": "STRING",
    "field_id": "STRING",
    "user_id": "STRING"
}
```

---

## 5. Injections (`injections`)
**File:** `src/qdash/store/slices/injectionSlice.js`

Manages signal injection patterns.

| Field | Type | Description |
| :--- | :--- | :--- |
| `userInjections` | `Array<Object>` | List of all injection objects created by the user. |
| `activeInjection` | `Object \| null` | Detailed view of a selected injection. |
| `loading` | `boolean` | Fetching state. |

## 6. Websocket (`websocket`)
**File:** `src/qdash/store/slices/websocketSlice.js`

Manages the live WebSocket connection state and health.

| Field | Type | Description |
| :--- | :--- | :--- |
| `isConnected` | `boolean` | Simple true/false flag for connection state. |
| `status` | `'connected' \| 'disconnected' \| 'error' \| 'connecting'` | Detailed status string. |
| `error` | `any \| null` | Error object if the connection failed. |
| `lastConnected` | `string \| null` | ISO timestamp of the last successful connection. |

---

## Aggregated Store Structure

```javascript
{
  sessions: {
    sessions: [],
    activeSessionId: null,
    activeSession: null,
    
    // Session Context Data
    activeSessionEnvs: [],      // Linked Envs
    activeSessionModules: [],   // Linked Modules
    activeSessionFields: [],    // Available Fields
    activeSessionConfig: {},    // Configuration Tree
    
    loading: false,
    error: null
  },
  envs: {
    userEnvs: [], // Global Pool
    loading: false
  },
  modules: {
    userModules: [], // Global Pool
    loading: false
  },
  fields: {
    userFields: [], // Array<FieldType>
    fieldInteractions: [], // Array<FieldToFieldType>
    moduleFields: [], // Array<ModuleToFieldType>
    loading: false
  },
  injections: {
    userInjections: [],
    activeInjection: null,
    loading: false
  },
  websocket: {
    isConnected: false,
    status: 'disconnected',
    error: null,
    lastConnected: null
  }
}
```
