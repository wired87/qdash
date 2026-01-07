# Injection WebSocket Message Format

## ✅ State in status.state, NOT in type

**Rule**: Message `type` does NOT include state suffixes like `_success` or `_error`.  
**State** is indicated by `status.state` field: `"pending"`, `"success"`, or `"error"`.

---

## Message Formats

### 1. get_inj_user - Request User Injections

**Request**:
```javascript
{
  auth: { user_id: "user_abc123" },
  data: {},  // Empty
  type: "get_inj_user",  // ✅ No _request suffix
  status: {
    error: null,
    state: "pending",
    message: "Requesting user injections",
    code: null
  }
}
```

**Response (Success)**:
```javascript
{
  auth: { user_id: "user_abc123" },
  data: {
    injections: [
      { id: "inj_123", data: [[0, 5, 10], [50, 100, 30]], ntype: "ELECTRON" }
    ]
  },
  type: "get_inj_user",  // ✅ Same type
  status: {
    error: null,
    state: "success",  // ✅ State here
    message: "Injections loaded",
    code: null
  }
}
```

---

### 2. set_inj - Save/Update Injection

**Request**:
```javascript
{
  auth: { user_id: "user_abc123" },
  data: {
    id: "inj_123",
    data: [[5, 8, 100], [3, 70, 89]],  // Sparse format
    ntype: "PHOTON"
  },
  type: "set_inj",  // ✅ No _request suffix
  status: {
    error: null,
    state: "pending",
    message: "Saving injection",
    code: null
  }
}
```

**Response (Success)**:
```javascript
{
  auth: { user_id: "user_abc123" },
  data: { id: "inj_123" },
  type: "set_inj",  // ✅ Same type, NOT set_inj_success
  status: {
    error: null,
    state: "success",  // ✅ Success indicated here
    message: "Injection saved successfully",
    code: null
  }
}
```

**Response (Error)**:
```javascript
{
  auth: { user_id: "user_abc123" },
  data: {},
  type: "set_inj",  // ✅ Same type, NOT set_inj_error
  status: {
    error: "Duplicate injection ID",  // ✅ Error message
    state: "error",  // ✅ Error indicated here
    message: "Failed to save injection",
    code: "DUPLICATE_ID"
  }
}
```

---

### 3. del_inj - Delete Injection

**Request**:
```javascript
{
  auth: { user_id: "user_abc123" },
  data: { id: "inj_123" },
  type: "del_inj",  // ✅ No _request suffix
  status: {
    error: null,
    state: "pending",
    message: "Deleting injection",
    code: null
  }
}
```

**Response (Success)**:
```javascript
{
  auth: { user_id: "user_abc123" },
  data: { id: "inj_123" },
  type: "del_inj",  // ✅ Same type, NOT del_inj_success
  status: {
    error: null,
    state: "success",
    message: "Injection deleted",
    code: null
  }
}
```

---

## Handler Pattern

### Backend
```python
def handle_message(message):
    msg_type = message.get("type")
    auth = message.get("auth", {})
    data = message.get("data", {})
    
    if msg_type == "set_inj":
        try:
            # Process injection
            result = save_injection(data)
            
            # Success response - same type
            return {
                "auth": auth,
                "data": {"id": result.id},
                "type": "set_inj",  # Same type
                "status": {
                    "error": None,
                    "state": "success",
                    "message": "Injection saved",
                    "code": None
                }
            }
        except Exception as e:
            # Error response - same type
            return {
                "auth": auth,
                "data": {},
                "type": "set_inj",  # Same type
                "status": {
                    "error": str(e),
                    "state": "error",
                    "message": "Failed to save",
                    "code": "SAVE_ERROR"
                }
            }
```

### Frontend
```javascript
if (message.type === "set_inj") {
  if (message.status?.state === "success") {
    console.log("✅ Success:", message.data.id);
  } else if (message.status?.state === "error") {
    console.error("❌ Error:", message.status.error);
  }
}
```

---

## Summary

| Message Type | Request type | Response type (success) | Response type (error) |
|--------------|--------------|------------------------|----------------------|
| get_inj_user | `get_inj_user` | `get_inj_user` | `get_inj_user` |
| set_inj | `set_inj` | `set_inj` | `set_inj` |
| del_inj | `del_inj` | `del_inj` | `del_inj` |

**State is in** `status.state`, **NOT** in `type`!

## ❌ Don't Do This
```javascript
// ❌ BAD - suffix in type
type: "set_inj_success"
type: "set_inj_error"
type: "del_inj_success"
```

## ✅ Do This
```javascript
// ✅ GOOD - state in status
type: "set_inj"
status: { state: "success" }

type: "set_inj"
status: { state: "error", error: "..." }
```
