import { NextResponse } from "next/server";
import { withGraphAuth, graphFetchWithTimeout } from "../with-graph-auth";

export const GET = withGraphAuth(async (accessToken) => {
  const user = await graphFetchWithTimeout(accessToken, "/me") as {
    id: string; displayName: string; mail?: string; userPrincipalName: string;
    jobTitle?: string; department?: string; businessPhones?: string[];
    mobilePhone?: string; officeLocation?: string;
  };

  let managerName = "";
  try {
    const mgr = await graphFetchWithTimeout(accessToken, "/me/manager") as { displayName: string; mail?: string };
    managerName = mgr.displayName;
  } catch {
    managerName = "";
  }

  return NextResponse.json({
    id: user.id,
    displayName: user.displayName,
    email: user.mail || user.userPrincipalName,
    jobTitle: user.jobTitle || "",
    department: user.department || "",
    manager: managerName,
    phone: user.businessPhones?.[0] || "",
    mobilePhone: user.mobilePhone || "",
    officeLocation: user.officeLocation || "",
  });
});
