# Script para crear estructura de carpetas por características

# Features
$features = @('chat', 'users', 'auth')
$featureFolders = @('components', 'hooks', 'slices', 'services', 'utils', 'types')

# Shared
$sharedFolders = @('middleware', 'services', 'types', 'utils', 'hooks', 'config')

# Common
$commonFolders = @('components', 'hooks', 'utils', 'constants')

# Crear estructura base
$basePath = "$PWD\frontend\src"

Write-Host "Creando estructura de carpetas..."

# Crear carpetas de features
foreach ($feature in $features) {
    $featurePath = "$basePath\features\$feature"
    
    if (!(Test-Path $featurePath)) {
        New-Item -Path $featurePath -ItemType Directory -Force | Out-Null
        Write-Host "Creado: $featurePath"
    }
    
    foreach ($folder in $featureFolders) {
        $path = "$featurePath\$folder"
        if (!(Test-Path $path)) {
            New-Item -Path $path -ItemType Directory -Force | Out-Null
            Write-Host "Creado: $path"
        }
    }
}

# Crear carpetas compartidas
$sharedPath = "$basePath\shared"
if (!(Test-Path $sharedPath)) {
    New-Item -Path $sharedPath -ItemType Directory -Force | Out-Null
    Write-Host "Creado: $sharedPath"
}

foreach ($folder in $sharedFolders) {
    $path = "$sharedPath\$folder"
    if (!(Test-Path $path)) {
        New-Item -Path $path -ItemType Directory -Force | Out-Null
        Write-Host "Creado: $path"
    }
}

# Crear carpetas comunes
$commonPath = "$basePath\common"
if (!(Test-Path $commonPath)) {
    New-Item -Path $commonPath -ItemType Directory -Force | Out-Null
    Write-Host "Creado: $commonPath"
}

foreach ($folder in $commonFolders) {
    $path = "$commonPath\$folder"
    if (!(Test-Path $path)) {
        New-Item -Path $path -ItemType Directory -Force | Out-Null
        Write-Host "Creado: $path"
    }
}

Write-Host "Estructura de carpetas creada con éxito."
