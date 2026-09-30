# POC Address

International address management proof-of-concept. Validates, formats, and displays addresses using LOQATE services.

## Architecture

- **Client** — Svelte SPA. Single page with centered search bar, country selector (defaults to UK), address input, Leaflet map, and results list.
- **API** — Three endpoints: Countries, Address Search (LOQATE Find), Address Detail (LOQATE Verify).
- **Map** — Leaflet map shows markers for search results. Click a marker to select a property and view verified details.

## APIs

Base URL: `http://localhost:5173/api`

### 1. Countries

`GET /countries`

Returns list of countries with flags for the selector dropdown.

### 2. Address Search

`GET /search?country={country}&query={query}`

Uses LOQATE Find API (interactive search). Returns matching addresses for a given country + search string.

**LOQATE Find Flow** (`/Capture/Interactive/Find/v1.20/json6.ws`):

1. Initial search with `Text` + `Countries` parameters
2. If results contain non-Address types (Postcode, Street, etc.), take the `Id` and pass it as `Container` in the next request
3. Repeat until `Type: "Address"` results are returned

Example: Searching `tf26rf` in GB returns a Postcode container. Feeding that back as `Container` returns individual addresses like `93 Teagues Crescent, Trench, Telford, TF2 6RF`.

### 3. Address Detail

`GET /retrieve?id={id}&text={text}&description={description}`

Uses LOQATE Verify API (`/Cleansing/International/Batch/v1.20/json6.ws`) to get verified address details.

Returns:
- Formatted address
- Address components (organisation, building, street, city, postcode, etc.)
- Geocoding data (latitude, longitude, accuracy)
- Verification codes (AVC, AQI, match score)

## API Documentation

Swagger UI: `http://localhost:5173/docs`

OpenAPI JSON: `http://localhost:5173/api/docs`

## Standard

Uses **UPU S42** (not ISO 20022). UPU S42 is more flexible, covers more countries, and is designed for web application adaptation.

## Reference

- LOQATE Find API: `archive/Readme.md`
- LOQATE Verify API: `archive/Readme.md`
