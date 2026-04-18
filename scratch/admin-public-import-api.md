# Admin Public Parking Import API

## Endpoint

`POST /api/admin/public-parking/import`

Phase 3 does not implement the bulk import route yet. This contract keeps future ingestion aligned with the same `PublicParkingRecord` model used by the admin CRUD routes in `src/app/api/admin/public-parking/*`.

## Payload Shape

```json
{
  "source": "bbmp-dataset-april-2026",
  "records": [
    {
      "name": "MG Road Public Parking",
      "address": "MG Road, Bengaluru",
      "latitude": 12.9756,
      "longitude": 77.6058,
      "type": "PUBLIC",
      "coverage": "OPEN",
      "availableHours": {
        "weekdays": "06:00-23:00"
      },
      "vehicleTypes": ["CAR", "BIKE"],
      "notes": "Roadside managed parking with attendants",
      "images": [],
      "sourceName": "BBMP",
      "sourceUrl": "https://example.gov/parking-feed"
    }
  ]
}
```

## Validation Rules

- `name`, `address`, `latitude`, `longitude`, `coverage`, and `type` are required.
- `type` must match the CRUD model enum: `PUBLIC` or `PRIVATE`.
- `coverage` must match the CRUD model enum: `OPEN`, `COVERED`, or `MULTI`.
- Coordinates must be valid floats in standard GPS ranges.
- `images` must be a list of absolute URLs.
- `sourceUrl` is optional but, when present, must be a valid URL.

## Duplicate Handling

- Match duplicates by normalized `name + address`.
- If an active record already exists, update the existing record instead of creating a second row.
- If the existing record is archived, restore it and overwrite importable fields.
- Import responses should report `created`, `updated`, `restored`, and `skipped` counts.

## Error Model

- Reject the request when more than 10% of rows fail validation.
- Return row-level validation errors with the original source index.
- Keep successful rows idempotent by attaching the import `source` to the stored metadata.

## Mapping Notes

- Imported records map directly to `PublicParkingRecord`.
- The admin CRUD UI should be able to edit imported rows without data migration.
- Archive behavior remains soft-delete only through `archivedAt`.
