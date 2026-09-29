---
epoch: 1790680681325
mode: agent
backendId: opencode
projectId: "e317956f-8fbd-4df8-806d-533350f57a47"
sessionId: "ses_f13a75b46ffep3Z6wDDit4eyDu"
agentLabel: "POC project: Svelte client and LOQATE API"
usage: '{"usedTokens":20926,"contextWindow":1000000,"updatedAt":1790680762255}'
tags:
  - copilot-conversation
---

**user**: in the wiki folder there should be a description of the project based on the markdown file in the raw folder. The project here is a POC which should have a client written in Svelte which talks to a API back end. The API layer should interact with the external LOQATE service to find addresses.
[Timestamp: 2026/09/29 12:18:01]

**ai**: The wiki folder is empty — no project description exists yet. I'll create one based on the raw file, then move the raw file to archive per the translate workflow.Done. Here's what happened:

- **Created** `wiki/poc-address.md` — a project description covering the Svelte client, API backend, LOQATE integration, the two APIs, and the UPU S42 standard choice.
- **Moved** `raw/Readme.md` to `archive/Readme.md` (per the translate workflow).
- **Committed** as `translate: poc-address wiki entry created from raw/Readme.md`.

The wiki entry captures the architecture at a high level. The raw file had significant detail on UPU S42 vs ISO 20022, the UK address format table, and the LOQATE curl examples — let me know if you want any of that folded into the wiki note or split into separate entries.
[Timestamp: 2026/09/29 12:18:01]

**user**: the svelte application should present a page which has a single centered search bar. The user is able to select a country, default to uk, and then enter into the search bar any address. the contents of the search bar and country should be passed to the Loqate search api. any results should be listed below.
[Timestamp: 2026/09/29 12:23:12]

**ai**: 
[Timestamp: 2026/09/29 12:23:12]