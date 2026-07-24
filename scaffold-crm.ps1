# ===========================================
# Enterprise CRM Scaffold
# ===========================================

$modules = @(
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

    Write-Host "Creating module: $module"

    # App Route
    New-Item -ItemType Directory -Force "app/$module" | Out-Null

    @"
import { $($module.Substring(0,1).ToUpper()+$module.Substring(1))Page } from "@/modules/$module/components/$($module.Substring(0,1).ToUpper()+$module.Substring(1))Page";

export default function Page() {
    return <$($module.Substring(0,1).ToUpper()+$module.Substring(1))Page />;
}
"@ | Set-Content "app/$module/page.tsx"

    # Module Structure
    New-Item -ItemType Directory -Force "modules/$module/components" | Out-Null
    New-Item -ItemType Directory -Force "modules/$module/hooks" | Out-Null
    New-Item -ItemType Directory -Force "modules/$module/services" | Out-Null

    New-Item "modules/$module/types.ts" -ItemType File -Force | Out-Null
    New-Item "modules/$module/mockData.ts" -ItemType File -Force | Out-Null
    New-Item "modules/$module/columns.tsx" -ItemType File -Force | Out-Null
    New-Item "modules/$module/validation.ts" -ItemType File -Force | Out-Null

    $pageName = $module.Substring(0,1).ToUpper() + $module.Substring(1)

@"
export function ${pageName}Page() {
    return (
        <div>
            <h1 className="text-3xl font-bold">$pageName</h1>
            <p className="text-muted-foreground">
                Coming soon...
            </p>
        </div>
    );
}
"@ | Set-Content "modules/$module/components/${pageName}Page.tsx"

}

Write-Host ""
Write-Host "CRM Scaffold Created Successfully!" -ForegroundColor Green