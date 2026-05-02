# Todo: Create WA Sender Tool Manifest & Register

**Status:** Pending  
**Implements:** specs/tool-architecture.md §Tool Manifest Format  
**Dependencies:** Item 07 (WA Sender API routes defined)  
**Blocks:** Item 05 (tool discovery)  
**Capacity:** Single task (<50 LOC)  

## Description

Create `app/tools/wa-sender/tool.manifest.json` with complete metadata for WA Sender. Once created, tool registry will auto-discover it, and navigation/sitemap will automatically include it (no manual updates needed).

## Implementation

Create file: `app/tools/wa-sender/tool.manifest.json`

```json
{
  "id": "wa-sender",
  "name": "WhatsApp Sender",
  "version": "1.0.0",
  "description": "Send bulk WhatsApp messages with templates and automation.",
  "icon": "/tools/wa-sender/icon.svg",
  "route": "/tools/wa-sender",
  "auth_required": true,
  "scope": ["wa-sender:read", "wa-sender:write"],
  "navigation": [
    {
      "label": "Dashboard",
      "href": "/tools/wa-sender",
      "icon": "dashboard"
    },
    {
      "label": "Messages",
      "href": "/tools/wa-sender/messages",
      "icon": "mail"
    },
    {
      "label": "Templates",
      "href": "/tools/wa-sender/templates",
      "icon": "template"
    },
    {
      "label": "Settings",
      "href": "/tools/wa-sender/settings",
      "icon": "settings"
    }
  ],
  "database_tables": [
    "wa_sender_conversations",
    "wa_sender_messages",
    "wa_sender_templates",
    "wa_sender_contacts"
  ],
  "api_endpoints": [
    "/api/wa-sender/conversations",
    "/api/wa-sender/messages",
    "/api/wa-sender/templates"
  ],
  "environment_variables": [
    "WHATSAPP_API_KEY",
    "WHATSAPP_BUSINESS_ACCOUNT_ID"
  ],
  "deployment": {
    "independent": true,
    "can_deploy_without_core": true,
    "requires_migration": true
  }
}
```

## Acceptance Criteria

- [ ] File exists at `app/tools/wa-sender/tool.manifest.json`
- [ ] Valid JSON (validates with `npm run validate:manifests`)
- [ ] `id` field is unique and matches tool directory name
- [ ] `route` field matches actual tool route
- [ ] `navigation` items have correct hrefs
- [ ] `database_tables` lists all WA Sender tables
- [ ] `api_endpoints` lists all WA Sender API routes
- [ ] `environment_variables` includes all required env vars
- [ ] Tool is discovered by registry: `curl /api/tools/list | grep wa-sender`

## Testing

```bash
# Verify manifest is valid JSON
jq . app/tools/wa-sender/tool.manifest.json
# Should print formatted JSON without errors

# Verify tool is discovered
curl http://localhost:3000/api/tools/list | grep -A5 '"id":"wa-sender"'
# Should show: id, name, route, navigation, etc.

# Verify navigation includes WA Sender
# Visit http://localhost:3000 in browser
# WA Sender should appear in tools menu
```

