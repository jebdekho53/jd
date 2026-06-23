# PowerShell: Generate RS256 key pair for JWT signing (Windows)
# Requirements: OpenSSL installed (bundled with Git for Windows)
# Run: .\scripts\generate-jwt-keys.ps1

$privateKeyFile = "jwt-private.pem"
$publicKeyFile  = "jwt-public.pem"

Write-Host "Generating RS256 key pair..." -ForegroundColor Cyan

openssl genrsa -out $privateKeyFile 2048 2>$null
openssl rsa -in $privateKeyFile -pubout -out $publicKeyFile 2>$null

$privateKey = (Get-Content $privateKeyFile) -join "\n"
$publicKey  = (Get-Content $publicKeyFile)  -join "\n"

Write-Host ""
Write-Host "Add to your .env:" -ForegroundColor Green
Write-Host ""
Write-Host "JWT_PRIVATE_KEY=`"$privateKey`""
Write-Host ""
Write-Host "JWT_PUBLIC_KEY=`"$publicKey`""
Write-Host ""

# Clean up temp files
Remove-Item $privateKeyFile, $publicKeyFile -Force

Write-Host "Done. Keep these keys secure — never commit them!" -ForegroundColor Yellow
