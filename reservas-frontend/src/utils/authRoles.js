function normalizeRole(value) {
  const roleText = String(value || "").toUpperCase();
  if (!roleText) return "";
  return roleText.startsWith("ROLE_") ? roleText : `ROLE_${roleText}`;
}

function readTokenRoles(token) {
  if (!token) return [];
  try {
    const payloadRaw = token.split(".")[1];
    if (!payloadRaw) return [];
    const payloadJson = atob(payloadRaw.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    const roles = payload?.roles;
    if (!Array.isArray(roles)) return [];
    return roles.map((r) => normalizeRole(r)).filter(Boolean);
  } catch {
    return [];
  }
}

export function isAdminSession(user, token) {
  const userRole = normalizeRole(user?.role);
  if (userRole === "ROLE_ADMIN") return true;

  const tokenRoles = readTokenRoles(token);
  return tokenRoles.includes("ROLE_ADMIN");
}
