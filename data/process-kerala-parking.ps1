/**
 * process-kerala-parking.ps1
 * Run this after downloading kerala-parking-raw.json from Overpass.
 * Converts raw Overpass JSON → compact data/kerala-parking.json
 * Format: [{id, lat, lng, name, label, type:[], tags:{}}]
 */

$raw = Get-Content "data\kerala-parking-raw.json" -Raw | ConvertFrom-Json

$features = @()

foreach ($el in $raw.elements) {
  # Determine lat/lng
  $lat = $null; $lng = $null
  if ($el.type -eq "node") {
    $lat = $el.lat; $lng = $el.lon
  } elseif ($el.type -eq "way" -and $el.center) {
    $lat = $el.center.lat; $lng = $el.center.lon
  }
  if ($null -eq $lat -or $null -eq $lng) { continue }

  $tags = $el.tags
  if (-not $tags) { $tags = @{} }

  # Name / label
  $name  = if ($tags.name)         { $tags.name }
           elseif ($tags."name:en") { $tags."name:en" }
           else { $null }

  # Human label for display
  $parkType = if ($tags.parking)       { $tags.parking }
              elseif ($tags.amenity)   { $tags.amenity }
              else { "parking" }
  $label = if ($name) { $name } else { "Parking ($parkType)" }

  # Type tags
  $typeArr = @()
  if ($tags.parking) {
    switch ($tags.parking) {
      "surface"      { $typeArr += "Surface" }
      "multi-storey" { $typeArr += "Multi-storey" }
      "underground"  { $typeArr += "Underground" }
      "carports"     { $typeArr += "Carports" }
      default        { $typeArr += $tags.parking }
    }
  }
  if ($tags.access -and $tags.access -ne "yes") { $typeArr += $tags.access }
  if ($tags.fee    -eq "yes")                    { $typeArr += "Paid" }
  if ($tags.fee    -eq "no")                     { $typeArr += "Free" }
  if ($tags.capacity)                             { $typeArr += "$($tags.capacity) spaces" }

  $feature = [ordered]@{
    id    = $el.id
    lat   = [math]::Round($lat, 6)
    lng   = [math]::Round($lng, 6)
    name  = $name
    label = $label
    type  = $typeArr
  }

  $features += $feature
}

Write-Host "Total features: $($features.Count)"

New-Item -ItemType Directory -Force -Path "data" | Out-Null
$features | ConvertTo-Json -Depth 5 -Compress | Out-File -FilePath "data\kerala-parking.json" -Encoding utf8

$fileSizeKB = [math]::Round((Get-Item "data\kerala-parking.json").Length / 1024, 1)
Write-Host "Written: data\kerala-parking.json ($fileSizeKB KB)"
