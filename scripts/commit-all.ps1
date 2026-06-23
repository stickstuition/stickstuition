param(
  [string]$Message = ""
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "Git is not installed or is not available on PATH."
}

git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
  git init
}

if ([string]::IsNullOrWhiteSpace($Message)) {
  $Message = "Site update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

git add -A

git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host "No changes to commit."
  exit 0
}

git commit -m $Message
