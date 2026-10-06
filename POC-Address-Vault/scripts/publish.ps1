<#
.SYNOPSIS
  Regenerates outputs/international-addressing.html from the wiki pages.
.DESCRIPTION
  - Content tabs (Overview, UPU S42, ISO 20022, UK Format, LOQATE API) are
    built from wiki/*.md via a lightweight markdown-to-HTML conversion.
  - The POC Design tab is inserted verbatim from scripts/design-tab.html
    (its hand-drawn SVG diagrams are not derivable from the wiki, whose
    Mermaid blocks are not rendered).
  - The page skeleton (CSS, tabs, script) comes from scripts/template.html.
.EXAMPLE
  powershell -File scripts/publish.ps1
#>

$ErrorActionPreference = 'Stop'
$vault  = Split-Path $PSScriptRoot -Parent   # vault root (POC-Address-Vault)
$wiki   = Join-Path $vault 'wiki'
$scripts = $PSScriptRoot
$out    = Join-Path (Split-Path $vault -Parent) 'outputs'
$tmpl   = Get-Content (Join-Path $scripts 'template.html') -Raw

function Convert-WikiPage {
  param([string]$Path)

  $lines = Get-Content $Path
  $html  = New-Object System.Collections.Generic.List[string]
  $i = 0
  while ($i -lt $lines.Count) {
    $line = $lines[$i]

    # Skip YAML-ish front matter noise, H1 title, Source: line, Related: line
    if ($line -match '^#\s' -or $line -match '^Source:' -or $line -match '^Related:') { $i++; continue }

    # Fenced code block
    if ($line -match '^```') {
      $buf = New-Object System.Collections.Generic.List[string]
      $i++
      while ($i -lt $lines.Count -and $lines[$i] -notmatch '^```') { $buf.Add($lines[$i]); $i++ }
      $i++
      $code = ($buf -join "`n") -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;'
      $html.Add('    <pre><code>' + $code + '</code></pre>')
      continue
    }

    # Table block
    if ($line -match '^\|') {
      $rows = New-Object System.Collections.Generic.List[string]
      while ($i -lt $lines.Count -and $lines[$i] -match '^\|') { $rows.Add($lines[$i]); $i++ }
      $html.Add('    <table>')
      $first = $true
      foreach ($r in $rows) {
        if ($r -match '^\|[\s\-|]+\|$') { continue }  # separator row
        $cells = $r.Trim('|').Split('|') | ForEach-Object { $_.Trim() }
        $tag = if ($first) { 'th' } else { 'td' }
        $html.Add('      <tr>' + (($cells | ForEach-Object { "<$tag>$((Format-Inline $_))</$tag>" }) -join '') + '</tr>')
        $first = $false
      }
      $html.Add('    </table>')
      continue
    }

    # Headings
    if ($line -match '^####\s+(.*)') { $html.Add("    <h4>$(Format-Inline $matches[1])</h4>"); $i++; continue }
    if ($line -match '^###\s+(.*)')  { $html.Add("    <h4>$(Format-Inline $matches[1])</h4>"); $i++; continue }
    if ($line -match '^##\s+(.*)')   { $html.Add("    <h3>$(Format-Inline $matches[1])</h3>"); $i++; continue }

    # Unordered list
    if ($line -match '^[-*]\s+') {
      $html.Add('    <ul style="color: var(--text-dim); padding-left: 1.5rem;">')
      while ($i -lt $lines.Count -and $lines[$i] -match '^[-*]\s+(.*)') {
        $html.Add("      <li>$(Format-Inline $matches[1])</li>"); $i++
      }
      $html.Add('    </ul>')
      continue
    }

    # Ordered list
    if ($line -match '^\d+\.\s+') {
      $html.Add('    <ol style="color: var(--text-dim); padding-left: 1.5rem;">')
      while ($i -lt $lines.Count -and $lines[$i] -match '^\d+\.\s+(.*)') {
        $html.Add("      <li>$(Format-Inline $matches[1])</li>"); $i++
      }
      $html.Add('    </ol>')
      continue
    }

    # Blank line
    if ([string]::IsNullOrWhiteSpace($line)) { $i++; continue }

    # Paragraph
    $html.Add("    <p>$(Format-Inline $line)</p>")
    $i++
  }
  return ($html -join "`n")
}

function Format-Inline {
  param([string]$Text)
  $t = $Text
  $t = $t -replace '\[\[([^\]]+)\]\]', '$1'          # [[wiki-link]] -> text
  $t = $t -replace '\*\*([^*]+)\*\*', '<strong>$1</strong>'
  $t = $t -replace '`([^`]+)`', '<code>$1</code>'
  return $t
}

function Tab-Block {
  param([string]$Comment, [string]$Id, [string]$Icon, [string]$Bg, [string]$Title, [string]$Subtitle, [string]$Inner, [switch]$Active)
  $activeCls = if ($Active) { ' active' } else { '' }
  $tpl = '<!-- ' + $Comment + ' -->' + "`n" +
         '<div class="tab-content' + $activeCls + '" id="' + $Id + '">' + "`n" +
         '  <div class="card">' + "`n" +
         '    <div class="card-header">' + "`n" +
         '      <div class="card-icon" style="background: ' + $Bg + ';">' + $Icon + '</div>' + "`n" +
         '      <div>' + "`n" +
         '        <h3 style="margin: 0;">' + $Title + '</h3>' + "`n" +
         '        <p style="margin: 0;">' + $Subtitle + '</p>' + "`n" +
         '      </div>' + "`n" +
         '    </div>' + "`n`n" +
         $Inner + "`n" +
         '  </div>' + "`n" +
         '</div>' + "`n`n"
  return $tpl
}

$io = [char]::ConvertFromUtf32(0x1F4CB)  # ðŸ“‹
$upuIcon = [char]::ConvertFromUtf32(0x1F4EE) # ðŸ“®
$isoIcon = [char]::ConvertFromUtf32(0x1F4B0) # ðŸ’°
$ukIcon = [char]::ConvertFromUtf32(0x1F1EC) + [char]::ConvertFromUtf32(0x1F1E7) # ðŸ‡¬ðŸ‡§
$apiIcon = [char]::ConvertFromUtf32(0x1F50C)  # plug
$ovTitle = 'Two Standards, Two Purposes'

$overview = Tab-Block 'Overview Tab'  'overview' $io   'rgba(99,102,241,0.2)'   $ovTitle 'Comparison of UPU S42 and ISO 20022 for global address management' (Convert-WikiPage (Join-Path $wiki 'Overview.md')) -Active
$upu      = Tab-Block 'UPU S42 Tab'   'upu'      $upuIcon 'rgba(99,102,241,0.2)'   'UPU S42 Addressing Standard' 'Universal Postal Union framework for postal addressing' (Convert-WikiPage (Join-Path $wiki 'UPU-S42.md'))
$iso      = Tab-Block 'ISO 20022 Tab' 'iso'      $isoIcon 'rgba(139,92,246,0.2)'   'ISO 20022 Address Schema' 'Financial messaging standard for transaction data' (Convert-WikiPage (Join-Path $wiki 'ISO-20022.md'))
$uk       = Tab-Block 'UK Format Tab' 'uk'       $ukIcon  'rgba(16,185,129,0.2)'   'UK Address Format' 'As described by UPU S42 (uses 9 of 15 elements)' (Convert-WikiPage (Join-Path $wiki 'UK-Address-Format.md'))
$api      = Tab-Block 'LOQATE API Tab' 'api'     $apiIcon 'rgba(245,158,11,0.2)'   'LOQATE API Integration' 'Reference implementation for address verification' (Convert-WikiPage (Join-Path $wiki 'Loqate-api.md'))
$design   = Get-Content (Join-Path $scripts 'design-tab.html') -Raw

$page = $tmpl
$page = $page.Replace('{{OVERVIEW}}', $overview)
$page = $page.Replace('{{UPU}}',      $upu)
$page = $page.Replace('{{ISO}}',      $iso)
$page = $page.Replace('{{UK}}',       $uk)
$page = $page.Replace('{{API}}',      $api)
$page = $page.Replace('{{DESIGN}}',   $design)

$target = Join-Path $out 'international-addressing.html'
Set-Content $target $page -NoNewline -Encoding UTF8
Write-Host "Wrote $target"

# Stage for GitHub Pages (served from /docs on the repo root)
$docs = Join-Path (Split-Path $vault -Parent) 'docs'
New-Item -ItemType Directory -Force (Join-Path $docs 'app') | Out-Null
Copy-Item $target (Join-Path $docs 'index.html')
Copy-Item (Join-Path (Join-Path $vault 'POC') 'poc-address-app.html') (Join-Path $docs 'app\index.html')
New-Item -ItemType File -Force (Join-Path $docs '.nojekyll') | Out-Null
Write-Host "Staged docs\index.html and docs\app\index.html"
