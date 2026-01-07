# Unsaved Changes Warning Feature

## Overview
Implemented warning dialogs to prevent users from accidentally losing their session configuration when they try to refresh the page or close the SessionConfig modal.

## Feature Description

### Two Types of Warnings

#### 1. **Browser Refresh/Close Warning**
When the user tries to:
- Refresh the page (F5, Ctrl+R, etc.)
- Close the browser tab/window
- Navigate away from the page

**Condition**: Only shows if there's active session configuration (environments with linked modules)

**Message**: Browser's native beforeunload dialog
```
"You have unsaved session configuration. Are you sure you want to leave?"
```

#### 2. **Modal Close Warning**
When the user tries to close the SessionConfig modal by clicking the X button

**Condition**: Only shows if there's active session configuration

**Message**: Custom confirmation dialog
```
"You have unsaved session configuration. Are you sure you want to close?

Click 'Start Simulation' to save your configuration before closing."
```

## Implementation Details

### Helper Function: `hasSessionConfigData()`
Checks if the current session has any configuration data:

```javascript
const hasSessionConfigData = useCallback(() => {
    // Check if there are any linked environments in the active session
    if (!activeSession?.id || !sessionData[activeSession.id]) return false;
    
    const envs = sessionData[activeSession.id]?.config?.envs;
    if (!envs || Object.keys(envs).length === 0) return false;
    
    // Check if any environment has modules
    return Object.values(envs).some(env => {
        const modules = env?.modules;
        return modules && Object.keys(modules).length > 0;
    });
}, [activeSession, sessionData]);
```

**Logic**:
1. Returns `false` if no active session
2. Returns `false` if no environments linked
3. Returns `true` if any environment has at least one module linked

### Browser Refresh Warning
Uses the `beforeunload` event:

```javascript
useEffect(() => {
    const handleBeforeUnload = (e) => {
        if (hasSessionConfigData()) {
            e.preventDefault();
            e.returnValue = 'You have unsaved session configuration. Are you sure you want to leave?';
            return e.returnValue;
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasSessionConfigData]);
```

**Behavior**:
- Event listener added when component mounts
- Checks for config data before showing warning
- Removed when component unmounts (cleanup)

### Modal Close Warning
Custom handler with confirmation dialog:

```javascript
const handleCloseModal = useCallback(() => {
    if (hasSessionConfigData()) {
        const confirmed = window.confirm(
            'You have unsaved session configuration. Are you sure you want to close?\n\n' +
            'Click "Start Simulation" to save your configuration before closing.'
        );
        if (!confirmed) return;
    }
    onClose();
}, [hasSessionConfigData, onClose]);
```

**Behavior**:
- Shows confirmation dialog if config data exists
- If user clicks "Cancel", modal stays open
- If user clicks "OK", modal closes (data lost)
- If no config data, closes immediately without warning

### UI Integration
Updated the close button to use the new handler:

```javascript
<Button isIconOnly variant="light" onPress={handleCloseModal}>
    <X size={24} />
</Button>
```

## User Experience Flows

### Scenario 1: User Has Configured Session
1. User links environments, modules, and fields
2. User tries to close modal → **Warning appears**
3. Options:
   - Click "Cancel" → Stay in modal, continue configuring
   - Click "OK" → Close modal, lose configuration
   - Click "Start Simulation" → Save and close

### Scenario 2: User Tries to Refresh Page
1. User has active session configuration
2. User presses F5 or Ctrl+R → **Browser warning appears**
3. Options:
   - Click "Stay" → Remain on page, keep configuration
   - Click "Leave" → Refresh page, lose configuration

### Scenario 3: User Starts Simulation
1. User configures session
2. User clicks "Start Simulation"
3. Modal closes **without warning** (config is saved)

### Scenario 4: Empty Session
1. User opens SessionConfig modal
2. User doesn't link any modules
3. User closes modal → **No warning** (nothing to lose)

## What Counts as "Unsaved Configuration"

### Triggers Warning ✅
- At least one environment linked to session
- At least one module linked to any environment
- Fields linked to modules
- Injections assigned to fields

### Does NOT Trigger Warning ❌
- Only environments linked (no modules)
- Empty session (no environments)
- Session selected but nothing configured

## Technical Notes

### Why Check for Modules?
The logic checks for modules rather than just environments because:
- Environments alone don't constitute meaningful configuration
- Modules + fields + injections are the actual simulation setup
- Prevents false positives when user just links an environment

### Browser Compatibility
The `beforeunload` event is supported in all modern browsers:
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

**Note**: Modern browsers show a generic message instead of the custom `e.returnValue` text for security reasons. The custom message is still set for older browsers.

### Memory Management
- Event listeners are properly cleaned up in `useEffect` return
- `useCallback` prevents unnecessary re-renders
- No memory leaks

## Files Modified
- ✅ `src/qdash/components/SessionConfig.js`
  - Added `hasSessionConfigData()` helper function
  - Added `beforeunload` event listener
  - Added `handleCloseModal()` with confirmation
  - Updated close button to use `handleCloseModal`

## Testing Checklist

### Browser Refresh Warning
- [ ] Configure session with modules
- [ ] Try to refresh page (F5) → Should show warning
- [ ] Click "Stay" → Should remain on page
- [ ] Try to close tab → Should show warning
- [ ] Empty session → Should NOT show warning

### Modal Close Warning
- [ ] Configure session with modules
- [ ] Click X button → Should show confirmation
- [ ] Click "Cancel" → Should stay in modal
- [ ] Click "OK" → Should close modal
- [ ] Empty session → Should close without warning

### Start Simulation
- [ ] Configure session
- [ ] Click "Start Simulation" → Should close without warning
- [ ] Verify simulation started

## Future Enhancements

### Possible Improvements
1. **Save Draft**: Auto-save configuration to localStorage
2. **Restore Draft**: Offer to restore unsaved config on page load
3. **Better UX**: Custom modal instead of browser confirm()
4. **Granular Warning**: Show what will be lost (e.g., "3 modules, 12 fields")
