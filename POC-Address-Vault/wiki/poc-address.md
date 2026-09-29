# POC Address

International address management proof-of-concept. Validates, formats, and displays addresses using the UPU S42 standard.

## Architecture

- **Client** — Svelte SPA. Single page with a centered search bar. Country selector (defaults to UK) + address input. Results listed below the search bar.
- **API** — Backend layer that proxies to the external LOQATE service for address search.
- **LOQATE** — External address search API (`api.addressy.com`). Returns matching addresses for a given country + search string.

## APIs

1. **Countries API** — Returns list of countries and their flags for the selector dropdown.
2. **Address Search API** — Accepts a country + search string, returns matching addresses from LOQATE.

### LOQATE Find Flow

The search uses the LOQATE Capture Interactive Find API (`/Capture/Interactive/Find/v1.20/json6.ws`). The process is recursive:

1. Initial search with `Text` + `Countries` parameters
2. If results contain non-Address types (Postcode, Street, etc.), take the `Id` and pass it as `Container` in the next request
3. Repeat until `Type: "Address"` results are returned
4. Address IDs can then be passed to the Retrieve API for full formatted addresses

Example: Searching `tf26rf` in GB returns a Postcode container `gb-rm|LlsU4aABbtdL8wmKap44`. Feeding that back as `Container` returns individual addresses like `41 Teagues Crescent, Trench, Telford, TF2 6RF`.

## Standard

Uses **UPU S42** (not ISO 20022). UPU S42 is more flexible, covers more countries, and is designed for web application adaptation. ISO 20022 is financial-messaging-specific and only applies to 32 countries.

Each country uses a subset of the 15 UPU S42 elements. Format templates are defined in `AddressFormats.json`.

## Reference

LOQATE Search API used as the reference implementation for address lookup.

Example request/response captured in the raw note: `archive/Readme.md`.
