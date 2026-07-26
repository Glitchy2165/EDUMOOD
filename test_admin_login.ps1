# Script para probar login de administrador
Write-Host "🔐 Probando login de administrador..." -ForegroundColor Green

# Datos del admin
$loginData = @{
    correo = "admin@edumod.com"
    contraseña = "Admin123!"
} | ConvertTo-Json

try {
    # Intentar login
    $response = Invoke-RestMethod -Uri "http://localhost:3001/login" -Method POST -Body $loginData -ContentType "application/json"
    
    Write-Host "✅ Login exitoso!" -ForegroundColor Green
    Write-Host "Mensaje: $($response.mensaje)" -ForegroundColor Yellow
    Write-Host "Usuario: $($response.user.role)" -ForegroundColor Cyan
    Write-Host "Redirección: $($response.redirect)" -ForegroundColor Magenta
    
    # Probar acceso al panel de admin
    Write-Host "`n🔧 Probando acceso al panel de administrador..." -ForegroundColor Green
    $adminResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin" -Method GET
    
    Write-Host "✅ Panel de admin accesible!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error en el login:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Respuesta del servidor: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`n📋 Para abrir el panel de admin en el navegador:" -ForegroundColor Blue
Write-Host "http://localhost:3001/admin" -ForegroundColor White 