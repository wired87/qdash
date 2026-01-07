# Debugging Unsaved Changes Warning

## Console Logging Added

I've added console logging to help debug why the warnings aren't showing. Here's what to check:

### Testing Steps

#### 1. **Open Browser Console**
- Press F12 to open DevTools
- Go to the Console tab

#### 2. **Test Modal Close Warning**
1. Open SessionConfig modal
2. Link an environment to a session
3. Enable SM switch (this will link GAUGE, HIGGS, FERMION modules)
4. Click the X button to close

**Expected Console Output:**
```
[SessionConfig] Has unsaved config: true
[SessionConfig] Close button clicked, hasData: true
```

**Expected Behavior:**
- Confirmation dialog should appear
- Dialog text: "You have unsaved session configuration. Are you sure you want to close?"

#### 3. **Test Page Refresh Warning**
1. With SessionConfig modal still open and configured
2. Press F5 or Ctrl+R to refresh

**Expected Console Output:**
```
[SessionConfig] Has unsaved config: true
[SessionConfig] beforeunload triggered, hasData: true
[SessionConfig] beforeunload warning shown
```

**Expected Behavior:**
- Browser's native warning dialog should appear
- Dialog asks if you want to leave the page

### Troubleshooting

#### If Console Shows: `[SessionConfig] No active session or session data`
**Problem**: `activeSession` or `sessionData` is not set correctly
**Check**:
- Is a session selected in the left panel?
- Does the session have the blue highlight?
- Check Redux state: `console.log(store.getState().sessions)`

#### If Console Shows: `[SessionConfig] No environments linked`
**Problem**: No environments are linked to the session
**Check**:
- Are environments visible in the "Linked Session Envs" section?
- Try linking an environment manually
- Check sessionData structure: `console.log(sessionData[activeSession.id])`

#### If Console Shows: `[SessionConfig] Has unsaved config: false`
**Problem**: Environments are linked but no modules
**Check**:
- Are modules visible when you select an environment?
- Try enabling SM switch
- Check if modules appear in the modules column

#### If Console Shows Nothing
**Problem**: The function isn't being called
**Check**:
- Is the modal actually open? (`isOpen` prop)
- Is the close button using `handleCloseModal`?
- For beforeunload: Is the event listener attached?

### Manual Verification

#### Check Redux State
Open console and run:
```javascript
// Get the store
const state = window.store.getState();

// Check sessions
console.log('Sessions:', state.sessions);

// Check active session
console.log('Active Session:', state.sessions.activeSession);

// Check session data
console.log('Session Data:', state.sessions.sessionData);

// Check specific session config
const sessionId = state.sessions.activeSession?.id;
if (sessionId) {
    console.log('Config for session:', state.sessions.sessionData[sessionId]?.config);
}
```

#### Check if Modal is Open
```javascript
// The modal should be rendered
document.querySelector('[class*="fixed inset-0"]') !== null
```

### Expected Data Structure

When everything is working, the sessionData should look like:
```javascript
{
  "session_abc123": {
    "envs": [...],
    "modules": [...],
    "fields": [...],
    "config": {
      "envs": {
        "env_1": {
          "modules": {
            "GAUGE": { "fields": {...} },
            "HIGGS": { "fields": {...} },
            "FERMION": { "fields": {...} }
          }
        }
      }
    }
  }
}
```

### Common Issues

#### Issue 1: Modal Not Considered "Open"
**Symptom**: `hasSessionConfigData` returns false because `isOpen` is false
**Solution**: Check that the `isOpen` prop is being passed correctly to SessionConfig

#### Issue 2: Session Not Active
**Symptom**: `activeSession` is null
**Solution**: Click on a session in the left panel to activate it

#### Issue 3: Modules Not Linked
**Symptom**: Environments are linked but no modules
**Solution**: 
- Manually link a module, OR
- Enable the SM switch for an environment

#### Issue 4: BeforeUnload Not Working
**Symptom**: Page refreshes without warning
**Possible Causes**:
1. Browser security: Some browsers ignore custom beforeunload messages
2. Event listener not attached
3. `hasSessionConfigData()` returning false

**Test**: Try adding a simple beforeunload:
```javascript
window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = 'Test';
    return e.returnValue;
});
```

### Next Steps

1. **Open the app**
2. **Open browser console (F12)**
3. **Follow the testing steps above**
4. **Share the console output** so we can see what's happening

The console logs will tell us exactly where the issue is!
