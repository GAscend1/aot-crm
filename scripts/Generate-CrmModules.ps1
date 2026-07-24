$modules = @(
    "customers",
    "companies",
    "contacts",
    "leads",
    "opportunities",
    "activities",
    "tickets",
    "documents",
    "reports",
    "administration"
)

foreach ($module in $modules) {

    $base = "app\(app)\$module"

    New-Item -ItemType Directory -Force -Path "$base\components" | Out-Null

    @(
        "columns.tsx",
        "data.ts",
        "types.ts",
        "loading.tsx",
        "error.tsx"
    ) | ForEach-Object {

        $file = Join-Path $base $_

        if (!(Test-Path $file)) {
            New-Item -ItemType File -Path $file | Out-Null
        }
    }

    $singular = (Get-Culture).TextInfo.ToTitleCase($module.TrimEnd("s"))

    @(
        "${singular}Stats.tsx",
        "${singular}Toolbar.tsx",
        "${singular}Table.tsx",
        "${singular}Form.tsx",
        "${singular}Drawer.tsx",
        "${singular}Filters.tsx",
        "${singular}DeleteDialog.tsx"
    ) | ForEach-Object {

        $file = Join-Path "$base\components" $_

        if (!(Test-Path $file)) {
            New-Item -ItemType File -Path $file | Out-Null
        }
    }
}

Write-Host ""
Write-Host "✅ CRM module structure created successfully!" -ForegroundColor Green