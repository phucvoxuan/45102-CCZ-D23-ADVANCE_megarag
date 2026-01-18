# Cấu hình đường dẫn
$basePath = Get-Location
$outputFile = Join-Path $basePath "PROJECT_STRUCTURE_EXPORT.md"

# --- KHỞI TẠO DANH SÁCH TRONG BỘ NHỚ (Tránh ghi file nhiều lần) ---
$content = New-Object System.Collections.Generic.List[string]

# Thêm Header
$content.Add("# PROJECT STRUCTURE EXPORT - $(Split-Path $basePath -Leaf)")
$content.Add("")
$content.Add("Generated: $(Get-Date)")
$content.Add("")
$content.Add("---")
$content.Add("")

# Lấy danh sách thư mục
$folders = Get-ChildItem -Path $basePath -Directory -Recurse | Sort-Object FullName

# Xử lý từng thư mục
foreach ($folder in $folders) {
    # Bỏ qua folder rác
    if ($folder.FullName -match "\\(\.git|node_modules|venv|__pycache__|\.claude|\.next)") { continue }

    $relativePath = $folder.FullName.Replace($basePath.Path, "")
    $files = Get-ChildItem -Path $folder.FullName -File
    
    if ($files.Count -gt 0) {
        $content.Add("")
        $content.Add("## FOLDER: $relativePath ($($files.Count) files)")
        $content.Add("")
        foreach ($file in $files) {
            $content.Add("- $($file.Name)")
        }
    }
}

# Thêm Footer
$totalFiles = (Get-ChildItem -Path $basePath -File -Recurse).Count
$content.Add("")
$content.Add("---")
$content.Add("")
$content.Add("**TOTAL FILES IN PROJECT: $totalFiles**")

# --- GHI XUỐNG FILE MỘT LẦN DUY NHẤT ---
try {
    # Xóa file cũ nếu cần thiết để tránh lock
    if (Test-Path $outputFile) { Remove-Item $outputFile -Force -ErrorAction SilentlyContinue }
    
    # Ghi toàn bộ nội dung
    $content | Set-Content -Path $outputFile -Encoding UTF8
    Write-Host "✅ SUCCESS! File exported to: $outputFile" -ForegroundColor Green
}
catch {
    Write-Host "❌ ERROR: Could not write file. Please close '$outputFile' in Cursor and try again." -ForegroundColor Red
    Write-Error $_
}
