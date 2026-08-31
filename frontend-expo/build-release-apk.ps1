$ErrorActionPreference = 'Stop'

$projectRoot = $PSScriptRoot
$androidDirectory = Join-Path $projectRoot 'android'
$appDirectory = Join-Path $androidDirectory 'app'
$keystorePath = Join-Path $appDirectory 'foodia-upload-key.jks'
$propertiesPath = Join-Path $androidDirectory 'keystore.properties'
$keyAlias = 'foodia-upload'

if ((Test-Path -LiteralPath $keystorePath) -xor (Test-Path -LiteralPath $propertiesPath)) {
    throw 'Keystore and keystore.properties must either both exist or both be absent.'
}

if (-not (Test-Path -LiteralPath $keystorePath)) {
    $passwordBytes = New-Object byte[] 24
    $randomNumberGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $randomNumberGenerator.GetBytes($passwordBytes)
    }
    finally {
        $randomNumberGenerator.Dispose()
    }
    $password = [Convert]::ToBase64String($passwordBytes).TrimEnd('=').Replace('+', 'A').Replace('/', 'B')

    $env:FOODIA_KEYSTORE_PASSWORD = $password
    try {
        & keytool `
            -genkeypair `
            -v `
            -storetype PKCS12 `
            -keystore $keystorePath `
            -alias $keyAlias `
            -keyalg RSA `
            -keysize 2048 `
            -validity 10000 `
            '-storepass:env' FOODIA_KEYSTORE_PASSWORD `
            '-keypass:env' FOODIA_KEYSTORE_PASSWORD `
            -dname 'CN=Foodia, OU=Portfolio, O=Foodia, L=Seoul, ST=Seoul, C=KR'
        if ($LASTEXITCODE -ne 0) {
            throw "keytool failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Remove-Item Env:FOODIA_KEYSTORE_PASSWORD -ErrorAction SilentlyContinue
    }

    $properties = @(
        'storeFile=foodia-upload-key.jks'
        "storePassword=$password"
        "keyAlias=$keyAlias"
        "keyPassword=$password"
    )
    [System.IO.File]::WriteAllLines($propertiesPath, $properties)
    Write-Output 'Created the Foodia release keystore and local signing properties.'
}

Push-Location $androidDirectory
try {
    $previousNodeEnvironment = $env:NODE_ENV
    $env:NODE_ENV = 'production'
    & .\gradlew.bat `
        app:assembleRelease `
        --no-daemon `
        --max-workers=1 `
        '-PreactNativeArchitectures=arm64-v8a'
    if ($LASTEXITCODE -ne 0) {
        throw "Gradle failed with exit code $LASTEXITCODE."
    }
}
finally {
    if ($null -eq $previousNodeEnvironment) {
        Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
    }
    else {
        $env:NODE_ENV = $previousNodeEnvironment
    }
    Pop-Location
}

$apkPath = Join-Path $appDirectory 'build\outputs\apk\release\app-release.apk'
if (-not (Test-Path -LiteralPath $apkPath)) {
    throw "Release APK was not found at $apkPath."
}

Write-Output "Signed release APK: $apkPath"
