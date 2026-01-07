# Cleanup of WebSocket Link Calls

## Overview
Confirmed removal of ALL `sendMessage` calls related to linking/unlinking items within the `SessionConfig.js` modal.

## Action Taken
Removed the remaining WebSocket calls that were located in the **inline action handlers** for fields.

### Files Modified
- `src/qdash/components/SessionConfig.js`

### Details
The following message types are **no longer sent** from SessionConfig:
- `LINK_ENV_SESSION`
- `RM_LINK_ENV_SESSION`
- `LINK_ENV_MODULE`
- `RM_LINK_ENV_MODULE`
- `LINK_MODULE_FIELD`
- `RM_LINK_MODULE_FIELD`

All these operations are now purely **local optimistic updates** using Redux. The configuration is only sent to the backend when "Start Simulation" is clicked, via the `START_SIM` message.

## Verification
1. Checked main handlers (`handleLinkEnv`, etc.) - ✅ Clean
2. Checked Standards Model toggle (`handleEnableSMToggle`) - ✅ Clean
3. Checked inline field list handlers - ✅ Clean
4. Verified `START_SIM` sends the full config - ✅ Confirmed

## Debugging
If you still see network traffic for link operations:
1. Ensure you are using the **Session Configuration** modal (Layer Icon), not the Environment Designer (Globe Icon).
2. Check if the file saved correctly (Console logs should show `[SessionConfig] Starting simulation with config:...` only on start).
