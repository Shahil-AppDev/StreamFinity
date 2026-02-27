$src = "G:\Desktop\Projet Web\StreamFinity\server\public\static\gifts"
$dst = "root@77.42.34.90:/var/www/tik.starline-agency.xyz/public/static/gifts/"
$files = Get-ChildItem -Path $src -Filter "*.png" | Sort-Object Name
$total = $files.Count
$batch = 50
$i = 0

Write-Host "Uploading $total gift images in batches of $batch..."

while ($i -lt $total) {
    $chunk = $files[$i..([Math]::Min($i + $batch - 1, $total - 1))]
    $paths = $chunk | ForEach-Object { $_.FullName }
    $end = [Math]::Min($i + $batch, $total)
    Write-Host "  Batch $([Math]::Floor($i/$batch)+1): files $($i+1)-$end of $total"
    scp -q $paths $dst 2>$null
    $i += $batch
}

Write-Host "Done! Uploaded $total files."
