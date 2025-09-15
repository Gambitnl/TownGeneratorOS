Param(
  [string]$EnvFile = "",
  [string]$ChannelId,
  [string]$Message,
  [int]$Limit = 15,
  [switch]$WhoAmI,
  [switch]$Read
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Read-EnvFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) { throw "Env file not found: $Path" }
  $cfg = @{}
  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line) { return }
    if ($line -match '^#') { return }
    $pair = $line -split '=',2
    if ($pair.Count -ge 2) {
      $k = $pair[0].Trim()
      $v = $pair[1].Trim().Trim('"')
      if ($k) { $cfg[$k] = $v }
    }
  }
  return $cfg
}

function Get-Utf8NoBomEncoding {
  return New-Object System.Text.UTF8Encoding($false)
}

function Get-HHMMUtc { (Get-Date).ToUniversalTime().ToString('HH:mm') }

if (-not $EnvFile -or $EnvFile -eq '') {
  $EnvFile = Join-Path $PSScriptRoot "..\config\.env.codex"
}
$cfg = Read-EnvFile -Path $EnvFile

# Prefer explicit ChannelId param; otherwise try status then active channel
if (-not $ChannelId -or $ChannelId -eq '') {
  $ChannelId = $cfg['DISCORD_AGENT_STATUS_CHANNEL']
  if (-not $ChannelId) { $ChannelId = $cfg['DISCORD_ACTIVE_WORK_CHANNEL'] }
}

$Token = $cfg['DISCORD_BOT_TOKEN']
if (-not $Token) { throw "DISCORD_BOT_TOKEN missing in $EnvFile" }
if (-not $ChannelId) { throw "ChannelId not provided and not found in $EnvFile" }

$api = 'https://discord.com/api/v10'
$authHeader = "Authorization: Bot {0}" -f $Token

if ($WhoAmI) {
  curl.exe -s -H $authHeader ("{0}/users/@me" -f $api)
  if (-not $Read -and -not $Message) { return }
}

if ($Read) {
  $url = "{0}/channels/{1}/messages?limit={2}" -f $api, $ChannelId, $Limit
  curl.exe -s -H $authHeader -H "Content-Type: application/json" $url
}

if ($Message) {
  $tmp = [IO.Path]::GetTempFileName()
  try {
    $json = @{ content = $Message } | ConvertTo-Json -Compress
    [IO.File]::WriteAllText($tmp, $json, (Get-Utf8NoBomEncoding))
    $postUrl = "{0}/channels/{1}/messages" -f $api, $ChannelId
    curl.exe -s -X POST -H $authHeader -H "Content-Type: application/json" --data-binary "@$tmp" $postUrl
  } finally {
    if (Test-Path $tmp) { Remove-Item $tmp -Force }
  }
}

