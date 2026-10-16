Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Duy Linh\.gemini\antigravity-ide\brain\f65be2ef-a9c8-4886-8d94-9f60f21a6484\.user_uploaded\media_1790750109103.jpg"
$outDir = "d:\CalisthenicsApp\calisthenics-platform-fe\public\assets\badges"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$img = [System.Drawing.Image]::FromFile($srcPath)
$w = $img.Width
$h = $img.Height
Write-Host "Source image size: ${w}x${h}"

# Helper function to crop and save
function Crop-Badge($name, $xPercent, $yPercent, $wPercent, $hPercent) {
    $cropX = [int]($xPercent * $w)
    $cropY = [int]($yPercent * $h)
    $cropW = [int]($wPercent * $w)
    $cropH = [int]($hPercent * $h)

    $rect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
    $bmp = New-Object System.Drawing.Bitmap($cropW, $cropH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

    $destRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)
    $g.DrawImage($img, $destRect, $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $targetFile = Join-Path $outDir "$name.png"
    $bmp.Save($targetFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Saved $name.png ($cropW x $cropH)"
}

# 1. Hero 7-Days Flame Badge (top center)
Crop-Badge "hero_7_flame" 0.420 0.050 0.160 0.280

# 2. Six Streak Badges in middle row
Crop-Badge "streak_7_flame" 0.045 0.345 0.125 0.210
Crop-Badge "streak_14_hands" 0.200 0.345 0.125 0.210
Crop-Badge "streak_30_planche" 0.360 0.345 0.125 0.210
Crop-Badge "streak_60_muscleup" 0.515 0.345 0.125 0.210
Crop-Badge "streak_100_mountain" 0.670 0.345 0.125 0.210
Crop-Badge "streak_200_winged" 0.825 0.345 0.145 0.210

# 3. Six Special Skill Badges in bottom row
Crop-Badge "skill_first_pullup" 0.075 0.750 0.085 0.140
Crop-Badge "skill_first_pushup" 0.230 0.750 0.085 0.140
Crop-Badge "skill_first_dips" 0.385 0.750 0.085 0.140
Crop-Badge "skill_handstand" 0.535 0.750 0.085 0.140
Crop-Badge "skill_frontlever" 0.690 0.750 0.085 0.140
Crop-Badge "skill_onearm_pullup" 0.840 0.750 0.085 0.140

$img.Dispose()

# Also crop the special ultra high-res 100 days ice crystal badge from media_1790756855690.png
$ultraPath = "C:\Users\Duy Linh\.gemini\antigravity-ide\brain\f65be2ef-a9c8-4886-8d94-9f60f21a6484\.user_uploaded\media_1790756855690.png"
if (Test-Path $ultraPath) {
    $uImg = [System.Drawing.Image]::FromFile($ultraPath)
    $uw = $uImg.Width
    $uh = $uImg.Height
    Write-Host "Ultra image size: ${uw}x${uh}"

    # Crop the central 3D ice crystal shield badge
    $uCropX = [int](0.30 * $uw)
    $uCropY = [int](0.08 * $uh)
    $uCropW = [int](0.40 * $uw)
    $uCropH = [int](0.68 * $uh)

    $uRect = New-Object System.Drawing.Rectangle($uCropX, $uCropY, $uCropW, $uCropH)
    $uBmp = New-Object System.Drawing.Bitmap($uCropW, $uCropH)
    $ug = [System.Drawing.Graphics]::FromImage($uBmp)
    $ug.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $ug.DrawImage($uImg, (New-Object System.Drawing.Rectangle(0, 0, $uCropW, $uCropH)), $uRect, [System.Drawing.GraphicsUnit]::Pixel)
    $ug.Dispose()

    $uTarget = Join-Path $outDir "streak_100_ultra_crystal.png"
    $uBmp.Save($uTarget, [System.Drawing.Imaging.ImageFormat]::Png)
    $uBmp.Dispose()
    $uImg.Dispose()
    Write-Host "Saved streak_100_ultra_crystal.png ($uCropW x $uCropH)"
}

Write-Host "All badges extracted successfully!"
