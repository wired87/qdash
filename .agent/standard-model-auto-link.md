# Standard Model Auto-Link Feature

## Overview
Implemented automatic linking/unlinking of Standard Model (SM) modules and fields when the "Enable SM" switch is toggled for an environment in the Session Configuration.

## Feature Description

### What Happens When Enable SM is Toggled ON
When a user enables the SM switch for an environment:
1. **3 Standard Model modules** are automatically linked to the environment:
   - `GAUGE` - Gauge bosons (force carriers)
   - `HIGGS` - Higgs boson
   - `FERMION` - Matter particles (leptons and quarks)

2. **All corresponding fields** are automatically linked to each module:

#### GAUGE Module Fields (12 fields)
```javascript
[
    "photon",      // A_μ (Electromagnetic force)
    "w_plus",      // W⁺ (Weak force)
    "w_minus",     // W⁻ (Weak force)
    "z_boson",     // Z⁰ (Weak force)
    "gluon_0", "gluon_1", "gluon_2", "gluon_3",  // Strong force
    "gluon_4", "gluon_5", "gluon_6", "gluon_7"   // (8 gluons total)
]
```

#### HIGGS Module Fields (1 field)
```javascript
[
    "higgs"  // Higgs boson (mass generation)
]
```

#### FERMION Module Fields (24 fields)
```javascript
[
    // Leptons (6)
    "electron", "muon", "tau",
    "electron_neutrino", "muon_neutrino", "tau_neutrino",
    
    // Quarks - 3 color charges each (18)
    "up_quark_1", "up_quark_2", "up_quark_3",
    "down_quark_1", "down_quark_2", "down_quark_3",
    "charm_quark_1", "charm_quark_2", "charm_quark_3",
    "strange_quark_1", "strange_quark_2", "strange_quark_3",
    "top_quark_1", "top_quark_2", "top_quark_3",
    "bottom_quark_1", "bottom_quark_2", "bottom_quark_3"
]
```

### What Happens When Enable SM is Toggled OFF
When a user disables the SM switch:
1. All fields are unlinked from their respective modules
2. All 3 SM modules are unlinked from the environment
3. The session configuration is cleaned up

## Implementation Details

### Constants Defined
```javascript
const GAUGE_FIELDS = [...];      // 12 gauge boson fields
const HIGGS_FIELDS = [...];      // 1 Higgs field
const FERMION_FIELDS = [...];    // 24 fermion fields

const SM_MODULES = {
    "GAUGE": GAUGE_FIELDS,
    "HIGGS": HIGGS_FIELDS,
    "FERMION": FERMION_FIELDS
};
```

### Handler Function
```javascript
const handleEnableSMToggle = (envId, enabled) => {
    setEnvEnableSM(prev => ({ ...prev, [envId]: enabled }));

    if (enabled) {
        // Link all SM modules and their fields
        Object.entries(SM_MODULES).forEach(([moduleId, fields]) => {
            // 1. Optimistically link module (instant UI)
            dispatch(optimisticLinkModule({ sessionId, envId, moduleId }));
            
            // 2. Send WebSocket to backend
            sendMessage({ type: "LINK_ENV_MODULE", ... });

            // 3. Link all fields for this module
            fields.forEach(fieldId => {
                dispatch(optimisticLinkField({ sessionId, envId, moduleId, fieldId }));
                sendMessage({ type: "LINK_MODULE_FIELD", ... });
            });
        });
    } else {
        // Unlink in reverse order (fields first, then modules)
        Object.entries(SM_MODULES).forEach(([moduleId, fields]) => {
            // 1. Unlink all fields
            fields.forEach(fieldId => {
                dispatch(optimisticUnlinkField({ sessionId, envId, moduleId, fieldId }));
                sendMessage({ type: "RM_LINK_MODULE_FIELD", ... });
            });

            // 2. Unlink module
            dispatch(optimisticUnlinkModule({ sessionId, envId, moduleId }));
            sendMessage({ type: "RM_LINK_ENV_MODULE", ... });
        });
    }
};
```

### UI Integration
The switch is shown in the environment list item:
```javascript
<ListItem
    showEnableSM={true}
    enableSM={envEnableSM[env.id] || false}
    onEnableSMChange={(val) => handleEnableSMToggle(env.id, val)}
/>
```

## User Experience

### Enable SM Flow
1. User clicks SM switch to ON for an environment
2. **Instant UI update** (optimistic):
   - GAUGE, HIGGS, FERMION modules appear in the modules list
   - All 37 fields appear in their respective modules
3. WebSocket messages sent to backend (3 module links + 37 field links = 40 messages)
4. Backend confirms the operations
5. Session configuration is now ready for Standard Model simulation

### Disable SM Flow
1. User clicks SM switch to OFF
2. **Instant UI update** (optimistic):
   - All 37 fields disappear
   - All 3 modules disappear
3. WebSocket messages sent to backend (37 field unlinks + 3 module unlinks = 40 messages)
4. Backend confirms the operations
5. Session configuration is cleaned up

## Benefits

### For Users
- ✅ **One-click setup** - No need to manually link 3 modules and 37 fields
- ✅ **Instant feedback** - UI updates immediately (optimistic updates)
- ✅ **Consistent configuration** - Always gets the complete Standard Model
- ✅ **Easy cleanup** - One click to remove all SM components

### For Physics Simulations
- ✅ **Complete particle physics** - All fundamental particles included
- ✅ **Proper field structure** - Organized by interaction type (gauge, Higgs, fermion)
- ✅ **Color charges** - Quarks properly separated by color (3 per flavor)
- ✅ **Force carriers** - All gauge bosons (photon, W±, Z⁰, 8 gluons)

## Total Items Linked
When SM is enabled for one environment:
- **3 modules**: GAUGE, HIGGS, FERMION
- **37 fields total**:
  - 12 gauge boson fields
  - 1 Higgs field
  - 24 fermion fields (6 leptons + 18 quarks)

## Files Modified
- ✅ `src/qdash/components/SessionConfig.js`
  - Added SM field definitions (GAUGE_FIELDS, HIGGS_FIELDS, FERMION_FIELDS)
  - Added SM_MODULES mapping
  - Added handleEnableSMToggle function
  - Updated onEnableSMChange callback

## Testing
To test the feature:
1. Open SessionConfig modal
2. Link an environment to a session
3. Toggle "SM" switch ON for the environment
   - ✅ Verify GAUGE, HIGGS, FERMION modules appear
   - ✅ Select each module and verify all fields are linked
4. Toggle "SM" switch OFF
   - ✅ Verify all modules and fields disappear
5. Check browser console for WebSocket messages
   - ✅ Should see LINK_ENV_MODULE and LINK_MODULE_FIELD messages when ON
   - ✅ Should see RM_LINK_MODULE_FIELD and RM_LINK_ENV_MODULE messages when OFF
