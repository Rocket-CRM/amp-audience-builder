# Audience Builder

A full-page WeWeb custom component for creating, editing, activating, and managing audiences (user segments). Audiences are defined by condition groups — when users meet those conditions, they're automatically added to the audience.

## Features

- **Audience List** — view all audiences with status, member count, and actions
- **Audience Builder** — visual condition builder supporting simple and aggregate condition groups
- **Audience Detail** — view audience info and paginated member list
- **Activate / Deactivate** — toggle audience evaluation with confirmation
- **Polaris UI** — built with Shopify Polaris design system via `polaris-weweb-styles`

## Installation

```bash
npm i
```

## Development

```bash
npm run serve --port=8080
```

Then open the WeWeb editor, open the developer popup, and add the custom element.

## Build

```bash
npm run build --name=audience-builder
```

## Data Bindings

| Property | Source | Description |
|---|---|---|
| Audiences Data | `bff_list_audiences()` → `data` | Array of audience objects |
| Collections Data | `bff_get_workflow_collections()` | Array of collections with fields |
| Audience Members | `bff_get_audience_members()` → `data` | Members for selected audience |
| Members Total Count | `bff_get_audience_members()` → `total` | Total member count |

## Trigger Events

| Event | Payload | Purpose |
|---|---|---|
| `create-audience` | `{name, description, conditions}` | User saves a new audience |
| `update-audience` | `{audience_id, name, description, conditions}` | User updates an audience |
| `delete-audience` | `{audience_id}` | User deletes an audience |
| `activate-audience` | `{audience_id, run_backfill}` | User activates an audience |
| `deactivate-audience` | `{audience_id}` | User deactivates an audience |
| `load-members` | `{audience_id, limit, offset, include_exited}` | Paginated member load |
| `refresh-audiences` | `{}` | Request to reload audiences |
| `view-changed` | `{view, audienceId}` | Navigation between views |

## Condition Format

```json
{
  "groups": [
    {
      "type": "simple",
      "collection": "user_accounts",
      "conditions": [
        { "field": "points_balance", "operator": "greater_than", "value": "1000" }
      ]
    },
    {
      "type": "aggregate",
      "collection": "purchase_ledger",
      "aggregate": "sum",
      "field": "final_amount",
      "operator": "gte",
      "value": "5000",
      "time_range": "90 days",
      "time_field": "created_at"
    }
  ]
}
```
