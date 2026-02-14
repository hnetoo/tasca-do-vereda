
Add-Type -AssemblyName System.Drawing

$sourcePath = ".\public\icon.jpg"
$destPath = ".\public\logo.png"

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source file not found: $sourcePath"
    # List files to help debug
    Get-ChildItem -Path ".\public" | Select-Object Name
    exit 1
}

$img = [System.Drawing.Image]::FromFile($sourcePath)
$maxDim = [Math]::Max($img.Width, $img.Height)

$bmp = New-Object System.Drawing.Bitmap($maxDim, $maxDim)
$graph = [System.Drawing.Graphics]::FromImage($bmp)
$graph.Clear([System.Drawing.Color]::Transparent)

$x = [int](($maxDim - $img.Width) / 2)
$y = [int](($maxDim - $img.Height) / 2)

$graph.DrawImage($img, $x, $y, $img.Width, $img.Height)

$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)

$img.Dispose()
$bmp.Dispose()
$graph.Dispose()

Write-Output "Created square logo at $destPath"
