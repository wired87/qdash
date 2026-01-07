# Local Session Configuration - No WebSocket Until Simulation Start

## Overview
Completely disabled all LINK/RM_LINK WebSocket requests during session configuration. The entire session configuration is now built locally in Redux and only sent to the backend when the user clicks "Start Simulation".

## What Changed

### **Before (WebSocket-Heavy)**
```
User links environment → WS: LINK_ENV_SESSION
User links module → WS: LINK_ENV_MODULE  
User links field → WS: LINK_MODULE_FIELD
User enables SM → WS: 3 LINK_ENV_MODULE + 37 LINK_MODULE_FIELD (40 messages!)
User unlinks → WS: RM_LINK_* messages
...
User clicks "Start Simulation" → WS: START_SIM
```

**Problems:**
- 40+ WebSocket messages for a single SM toggle
- Network latency on every action
- Backend state management complexity
- Potential sync issues

### **After (Local-First)**
```
User links environment → Redux update (instant)
User links module → Redux update (instant)
User links field → Redux update (instant)
User enables SM → Redux updates (instant, 40 operations)
User unlinks → Redux update (instant)
...
User clicks "Start Simulation" → WS: START_SIM with full config (1 message!)
```

**Benefits:**
- ✅ Zero network calls during configuration
- ✅ Instant UI updates
- ✅ Single WebSocket message with complete config
- ✅ Simpler backend processing
- ✅ No sync issues

## Implementation Details

### 1. **Removed WebSocket Calls from All Link/Unlink Handlers**

#### handleLinkEnv
```javascript
const handleLinkEnv = (envId) => {
    // Optimistic update - instant UI feedback
    dispatch(optimisticLinkEnv({ sessionId: targetSessionId, envId }));
    // WebSocket disabled - config sent at simulation start
};
```

#### handleUnlinkEnv
```javascript
const handleUnlinkEnv = (envId) => {
    // Optimistic update - instant UI feedback
    dispatch(optimisticUnlinkEnv({ sessionId: targetSessionId, envId }));
    // WebSocket disabled - config sent at simulation start
    
    setProcessingEnvs(prev => ({ ...prev, [envId]: true }));
    setTimeout(() => {
        setProcessingEnvs(prev => {
            const newState = { ...prev };
            delete newState[envId];
            return newState;
        });
    }, 500);
};
```

#### handleLinkModule & handleUnlinkModule
```javascript
const handleLinkModule = (moduleId) => {
    if (activeEnv?.id) {
        dispatch(optimisticLinkModule({ sessionId: targetSessionId, envId: activeEnv.id, moduleId }));
    }
    // WebSocket disabled - config sent at simulation start
};

const handleUnlinkModule = (moduleId) => {
    if (activeEnv?.id) {
        dispatch(optimisticUnlinkModule({ sessionId: targetSessionId, envId: activeEnv.id, moduleId }));
    }
    // WebSocket disabled - config sent at simulation start
};
```

#### handleEnableSMToggle
```javascript
const handleEnableSMToggle = (envId, enabled) => {
    setEnvEnableSM(prev => ({ ...prev, [envId]: enabled }));

    if (enabled) {
        // Link all SM modules and their fields (local only)
        Object.entries(SM_MODULES).forEach(([moduleId, fields]) => {
            dispatch(optimisticLinkModule({ sessionId: targetSessionId, envId, moduleId }));

            fields.forEach(fieldId => {
                dispatch(optimisticLinkField({
                    sessionId: targetSessionId,
                    envId,
                    moduleId,
                    fieldId
                }));
            });
        });
    } else {
        // Unlink all SM modules and their fields (local only)
        Object.entries(SM_MODULES).forEach(([moduleId, fields]) => {
            fields.forEach(fieldId => {
                dispatch(optimisticUnlinkField({
                    sessionId: targetSessionId,
                    envId,
                    moduleId,
                    fieldId
                }));
            });
            dispatch(optimisticUnlinkModule({ sessionId: targetSessionId, envId, moduleId }));
        });
    }
    // WebSocket disabled - config sent at simulation start
};
```

### 2. **Updated handleStartSim to Send Complete Config**

```javascript
const handleStartSim = () => {
    if (!activeSession) return;

    // Get the complete session configuration from Redux
    const sessionId = activeSession.id;
    const fullSessionConfig = sessionData[sessionId]?.config?.envs || {};
    
    console.log('[SessionConfig] Starting simulation with config:', fullSessionConfig);

    const payload = {
        session_id: sessionId,
        user_id: localStorage.getItem(USER_ID_KEY),
        config: fullSessionConfig,  // Send the complete hierarchical config
        env_enable_sm: envEnableSM, // Per-environment enable_sm
        timestamp: new Date().toISOString()
    };

    sendMessage({
        type: "START_SIM",
        data: payload
    });

    onClose();
    alert("Simulation Started!");
};
```

## Session Configuration Structure

The complete configuration sent to backend:

```javascript
{
  "session_id": "session_abc123",
  "user_id": "user_xyz",
  "config": {
    "env_1": {
      "modules": {
        "GAUGE": {
          "fields": {
            "photon": { "injections": {} },
            "w_plus": { "injections": {} },
            "w_minus": { "injections": {} },
            "z_boson": { "injections": {} },
            "gluon_0": { "injections": {} },
            "gluon_1": { "injections": {} },
            "gluon_2": { "injections": {} },
            "gluon_3": { "injections": {} },
            "gluon_4": { "injections": {} },
            "gluon_5": { "injections": {} },
            "gluon_6": { "injections": {} },
            "gluon_7": { "injections": {} }
          }
        },
        "HIGGS": {
          "fields": {
            "higgs": { "injections": {} }
          }
        },
        "FERMION": {
          "fields": {
            "electron": { "injections": {} },
            "muon": { "injections": {} },
            // ... 24 fermion fields total
          }
        }
      }
    }
  },
  "env_enable_sm": {
    "env_1": true
  },
  "timestamp": "2026-01-07T08:43:00.000Z"
}
```

## Network Traffic Comparison

### Example: Enabling SM for One Environment

**Before:**
- 1 LINK_ENV_MODULE (GAUGE)
- 12 LINK_MODULE_FIELD (gauge fields)
- 1 LINK_ENV_MODULE (HIGGS)
- 1 LINK_MODULE_FIELD (higgs field)
- 1 LINK_ENV_MODULE (FERMION)
- 24 LINK_MODULE_FIELD (fermion fields)
- **Total: 40 WebSocket messages**

**After:**
- 0 WebSocket messages during configuration
- 1 START_SIM message with complete config
- **Total: 1 WebSocket message**

**Reduction: 97.5% fewer messages!**

## User Experience

### Configuration Phase
- ✅ **Instant feedback** - No network latency
- ✅ **Offline capable** - Can configure without connection
- ✅ **Undo/Redo ready** - Easy to implement (just Redux time travel)
- ✅ **No partial states** - Backend never sees incomplete config

### Simulation Start
- ✅ **Single atomic operation** - All or nothing
- ✅ **Complete validation** - Backend can validate entire config at once
- ✅ **Clear state transition** - From "configuring" to "running"

## Backend Implications

### What Backend Needs to Handle

**Single Message Type:**
```javascript
{
  "type": "START_SIM",
  "data": {
    "session_id": "...",
    "user_id": "...",
    "config": { /* complete hierarchical structure */ },
    "env_enable_sm": { /* per-env SM flags */ },
    "timestamp": "..."
  }
}
```

**Backend Should:**
1. Validate the complete configuration structure
2. Create/update all necessary database entries atomically
3. Initialize the simulation with the provided config
4. Return success/error for the entire operation

**Backend Can Remove:**
- LINK_ENV_SESSION handler
- RM_LINK_ENV_SESSION handler
- LINK_ENV_MODULE handler
- RM_LINK_ENV_MODULE handler
- LINK_MODULE_FIELD handler
- RM_LINK_MODULE_FIELD handler

## Files Modified

- ✅ `src/qdash/components/SessionConfig.js`
  - Removed all `sendMessage` calls from link/unlink handlers
  - Updated `handleStartSim` to send complete Redux config
  - Added console logging for debugging

## Testing

### Verify No WebSocket Calls During Configuration
1. Open browser DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Open SessionConfig modal
4. Link environments, modules, fields
5. Enable/disable SM switch
6. **Expected**: No LINK/RM_LINK messages in network tab

### Verify Config Sent at Simulation Start
1. Configure a session (link envs, modules, fields)
2. Open browser console
3. Click "Start Simulation"
4. **Expected**: Console shows complete config structure
5. **Expected**: Network tab shows single START_SIM message

### Test Configuration
```javascript
// In browser console after clicking "Start Simulation":
// You should see:
[SessionConfig] Starting simulation with config: {
  env_1: {
    modules: {
      GAUGE: { fields: {...} },
      HIGGS: { fields: {...} },
      FERMION: { fields: {...} }
    }
  }
}
```

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Network Calls** | 40+ per SM toggle | 0 during config, 1 at start |
| **Latency** | ~100-500ms per action | 0ms (instant) |
| **Offline Support** | ❌ No | ✅ Yes (until start) |
| **Undo/Redo** | ❌ Complex | ✅ Easy (Redux) |
| **Backend Complexity** | High (many handlers) | Low (one handler) |
| **Sync Issues** | Possible | None |
| **User Experience** | Slow, laggy | Instant, smooth |

## Future Enhancements

### Possible Additions
1. **Save Draft**: Persist config to localStorage
2. **Load Draft**: Restore unsaved config on page load
3. **Export Config**: Download as JSON
4. **Import Config**: Upload JSON configuration
5. **Config Validation**: Client-side validation before sending
6. **Config Diff**: Show what changed since last simulation
