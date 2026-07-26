Write-Host "🔐 Probando login de administrador..." -ForegroundColor Green

$loginData = @{
    correo = "admin@edumod.com"
    contraseña = "Admin123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "✅ Login exitoso!" -ForegroundColor Green
    Write-Host "Mensaje: $($response.mensaje)" -ForegroundColor Yellow
    Write-Host "Usuario: $($response.user.role)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Error en el login:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n📋 Para abrir el panel de admin en el navegador:" -ForegroundColor Blue
Write-Host "http://localhost:3001/admin" -ForegroundColor White 