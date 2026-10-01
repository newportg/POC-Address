# POC Address — Design Documentation

## Overview

International address search and verification POC. Users search for addresses by country and query, view results on a map, and select a property to see LOQATE-verified address details.

## Architecture

```mermaid
graph TB
    subgraph Client["Svelte SPA"]
        UI[Search Bar + Country Selector]
        MAP[Leaflet Map]
        LIST[Results List]
        DETAIL[Address Detail Panel]
    end

    subgraph API["SvelteKit API Routes"]
        C[GET /api/countries]
        S[GET /api/search]
        R[GET /api/retrieve]
        D[GET /api/docs]
    end

    subgraph External["LOQATE Services"]
        FIND[Capture Interactive Find]
        VERIFY[Cleansing International Batch]
    end

    subgraph Cache["SQLite Cache"]
        DB[(address_cache)]
    end

    UI --> C
    UI --> S
    LIST --> R
    MAP --> R

    S --> FIND
    R --> VERIFY
    R --> DB
```

## Component Diagram

```mermaid
graph LR
    subgraph Pages
        P[+page.svelte]
        DOCS[docs/+page.svelte]
    end

    subgraph Components
        MAP[Map.svelte]
    end

    subgraph Lib
        TYPES[types.ts]
        CACHE[cache.ts]
        FORMATS[AddressFormats.json]
    end

    subgraph API
        COUNTRIES[api/countries]
        SEARCH[api/search]
        RETRIEVE[api/retrieve]
        DOCS_API[api/docs]
    end

    P --> MAP
    P --> TYPES
    MAP --> TYPES
    SEARCH --> TYPES
    RETRIEVE --> CACHE
    DOCS --> DOCS_API
```

## Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Svelte SPA
    participant API as API Routes
    participant L as LOQATE
    participant DB as SQLite Cache

    U->>UI: Select country + enter query
    UI->>API: GET /api/search?country=GB&query=tf26rf
    API->>L: Find API (recursive container drill-down)
    L-->>API: Address results
    API-->>UI: { results: [...] }
    UI->>UI: Plot markers on map

    U->>UI: Click address in list
    UI->>API: GET /api/retrieve?id=...&country=GB
    API->>DB: Check cache
    alt Cache hit
        DB-->>API: Cached response
    else Cache miss
        API->>L: Verify API (OutputAddressFormat=YES)
        L-->>API: Verified address + AddressFormat
        API->>DB: Store response
    end
    API-->>UI: { match: {...} }
    UI->>UI: Display formatted address using AddressFormat
```

## User Flow

```mermaid
flowchart TD
    A[Page Load] --> B[Fetch Countries]
    B --> C[Display World Map]
    C --> D[User Selects Country]
    D --> E[User Enters Search Query]
    E --> F[Search API Call]
    F --> G[Display Markers on Map]
    G --> H[User Clicks Marker or List Item]
    H --> I[Retrieve API Call]
    I --> J{Cache Hit?}
    J -->|Yes| K[Return Cached Data]
    J -->|No| L[LOQATE Verify Call]
    L --> M[Store in Cache]
    M --> K
    K --> N[Display Formatted Address]
    N --> O[Show Verification Badges]
    O --> P[Show All Fields]
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/countries` | GET | List of countries with flags |
| `/api/search` | GET | Search addresses via LOQATE Find |
| `/api/retrieve` | GET | Get verified address via LOQATE Verify |
| `/api/docs` | GET | OpenAPI 3.0 JSON spec |
| `/docs` | GET | Swagger UI |

## Database Schema

```mermaid
erDiagram
    address_cache {
        TEXT id PK
        TEXT response
        INTEGER created_at
    }
```

**Cache table:**
- `id` — Address ID from LOQATE Find (primary key)
- `response` — JSON blob of LOQATE Verify response
- `created_at` — Unix timestamp of cache entry

## LOQATE Integration

### Find API (Search)

```
GET https://api.addressy.com/Capture/Interactive/Find/v1.20/json6.ws
```

**Parameters:**
- `Key` — API key
- `Text` — Search text
- `Countries` — ISO 3166-1 alpha-2 code
- `Container` — Parent container ID (for recursive drill-down)
- `Limit` — Max results (100)

**Recursive flow:**
1. Search with `Text` + `Countries`
2. If result `Type` is not `Address`, use `Id` as `Container`
3. Repeat until `Type: "Address"` results returned

### Verify API (Retrieve)

```
POST https://api.addressy.com/Cleansing/International/Batch/v1.20/json6.ws
```

**Request body:**
```json
{
  "Key": "...",
  "GeoCode": true,
  "Addresses": [{
    "Id": "...",
    "Address": "...",
    "Address1": "...",
    "Locality": "...",
    "Country": "..."
  }],
  "Options": {
    "Process": "Verify",
    "Enhance": false,
    "ServerOptions": {
      "OutputAddressFormat": "YES"
    }
  }
}
```

**Key response fields:**
- `Address` — Full formatted address
- `AddressFormat` — Field mapping used to construct Address (string with `<BR>` separators)
- `Address1-8` — Individual address lines
- `Organisation`, `Building`, `Premise`, `Thoroughfare` — Address components
- `Locality`, `PostalCode`, `AdministrativeArea` — Location data
- `Latitude`, `Longitude`, `GeoAccuracy` — Geocoding
- `AVC`, `AQI`, `MatchScore` — Verification quality indicators

## Address Formatting

The `AddressFormat` field from LOQATE defines how to construct the formatted address. It's a string with field names separated by `<BR>` tags.

**Example (UK):**
```
Organisation<BR>DeliveryAddress<BR>Locality AdministrativeArea PostalCode
```

**Rendering logic:**
1. Split `AddressFormat` by `<BR>` to get lines
2. For each line, split by whitespace to get field names
3. Look up each field name in the LOQATE response
4. Join non-empty values with spaces

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Svelte 5 + SvelteKit 2 |
| Map | Leaflet + OpenStreetMap |
| API | SvelteKit server routes |
| Cache | SQLite (better-sqlite3) |
| API Docs | Swagger UI |
| External | LOQATE Find + Verify APIs |
