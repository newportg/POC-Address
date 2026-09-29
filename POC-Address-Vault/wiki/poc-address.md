# POC Address

International address management proof-of-concept. Validates, formats, and displays addresses using the UPU S42 standard.

## Architecture

- **Client** — Svelte SPA. Country dropdown with flags, single-line address input, formatted results display.
- **API** — Backend layer that proxies to the external LOQATE service for address cleansing and element extraction.
- **LOQATE** — External address validation API (`api.addressy.com`). Returns structured address elements per country.

## APIs

1. **Countries API** — Returns list of countries, their flags, and UPU S42 format templates.
2. **Address Parse API** — Accepts a country + single-line address string, returns the address broken into UPU S42 elements formatted for that country.

## Standard

Uses **UPU S42** (not ISO 20022). UPU S42 is more flexible, covers more countries, and is designed for web application adaptation. ISO 20022 is financial-messaging-specific and only applies to 32 countries.

Each country uses a subset of the 15 UPU S42 elements. Format templates are defined in `AddressFormats.json`.

## Reference

LOQATE Batch API used as the reference implementation for address element extraction.

Example request/response captured in the raw note: `raw/Readme.md` (now archived).
