# Quick activate script — chạy bằng: . .\activate.ps1
# (chú ý dấu chấm và space ở đầu — bắt buộc để env stay active)

Set-Location $PSScriptRoot
& "$PSScriptRoot\.venv\Scripts\Activate.ps1"
Write-Host ""
Write-Host "  Venv activated. Common commands:" -ForegroundColor Cyan
Write-Host "    pytest -v                                       # run tests"
Write-Host "    python -m scripts.scrape_chotot --limit 100     # scrape"
Write-Host "    python -m scripts.stats                         # show dataset stats"
Write-Host "    uvicorn app.main:app --reload --port 8000       # run vision API"
Write-Host ""
