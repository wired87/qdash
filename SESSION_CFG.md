# SESSION_CFG Structure

This document outlines the schematic structure of the `SESSION_CFG` object, which defines the complete configuration for running a simulation session.

## Top-Level Payload (`START_SIM`)

When a simulation is started via `START_SIM`, the following payload is sent to the backend.

```json
{
  "type": "START_SIM",
  "data": {
    "session_id": "string (UUID or Session Name)",
    "config": {
      "envs": {
        // Mapping of Env IDs to their configuration
      }
    },
    "timestamp": "ISO 8601 Date String"
  }
}
```

## Deeply Nested Config Structure

 The configuration follows a strict hierarchy: **Session → Environment → Module → Field → Injection**.

### 1. `envs` Dictionary
- **Key**: `env_id` (string)
- **Value**: Object containing modules.

### 2. `modules` Dictionary
- **Key**: `module_id` (string)
- **Value**: Object containing fields.
- **Context**: Defines which codebases are active for this specific environment.

### 3. `fields` Dictionary
- **Key**: `field_id` (string)
- **Value**: Object containing injection mappings.
- **Context**: Specific data layers provided by the module.

### 4. `injections` Dictionary (Node Assignment)
- **Key**: `node_position_key` (string, e.g., `"[0,0,0]"`)
- **Value**: `injection_id` (string)

## Example JSON Representation

```json
{
  "session_id": "sess_001",
  "config": {
    "envs": {
      "env_alpha": {
        "modules": {
          "mod_physics_v1": {
            "fields": {
              "electric_field": {
                "injections": {
                  "[0,0,0]": "inj_pulse_01",
                  "[1,0,0]": "inj_pulse_01"
                }
              },
              "magnetic_field": {
                "injections": {
                   "[5,5,5]": "inj_static_02"
                }
              }
            }
          }
        }
      },
      "env_beta": {
        "modules": {
          "mod_quantum_v2": {
            "fields": {
              "wave_function": {
                "injections": {
                  "[2,2,2]": "inj_wave_packet"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## Data Collecting Workflow (Frontend)

To generate this structure, the User Interface enforces a cascading selection flow:

1.  **Select Session** (Global Context)
2.  **Select Environment** (from Session's linked Envs) -> Sets `activeEnv`
3.  **Select/Assign Module** (from Session's linked Modules) -> Sets `activeModule`
4.  **Select Field** (from Module's Fields) -> Sets `activeField`
5.  **Assign Injections** (Paint on 3D Cluster) -> Updates `config.envs[env].modules[mod].fields[field].injections`
