Add-Type -AssemblyName System.Drawing

$srcDir = "d:\CalisthenicsApp\calisthenics-platform-fe\public\assets\badges"
$files = Get-ChildItem -Path $srcDir -Filter "*.png"

Write-Host "Found $($files.Count) badge images to upscale and sharpen..."

foreach ($f in $files) {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    $w = $img.Width
    $h = $img.Height
    
    # Target size: 400 x 480 or 512 x 512
    $targetW = [Math]::Max(400, $w * 3)
    $targetH = [Math]::Max(460, $h * 3)
    
    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $destRect = New-Object System.Drawing.Rectangle(0, 0, $targetW, $targetH)
    $g.DrawImage($img, $destRect, 0, 0, $w, $h, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $img.Dispose()

    # Save to temporary and overwrite
    $tempPath = "$($f.FullName).tmp.png"
    $bmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    Move-Item -Path $tempPath -Destination $f.FullName -Force
    Write-Host "Upscaled $($f.Name) to ${targetW}x${targetH}"
}

Write-Host "All badge assets successfully upscaled!"
