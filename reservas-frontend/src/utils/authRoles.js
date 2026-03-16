function normalizeRole(value) {
  const roleText = String(value || "").toUpperCase();
  if (!roleText) return "";
  return roleText.startsWith("ROLE_") ? roleText : `ROLE_${roleText}`;
}

function readTokenRoles(token) {
  if (!token) return [];
  try {
    const raw = String(token || "").replace(/^Bearer\s+/i, "");
    const payloadRaw = raw.split(".")[1];
    if (!payloadRaw) return [];
    const payloadJson = atob(payloadRaw.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    const roles = payload?.roles ?? payload?.role ?? payload?.authorities;
    if (Array.isArray(roles)) {
      return roles.map((r) => normalizeRole(r)).filter(Boolean);
    }
    if (typeof roles === "string") {
      return roles
        .split(",")
        .map((r) => normalizeRole(r))
        .filter(Boolean);
    }
    return [];
  } catch {
    return [];
  }
}

export function isAdminSession(user, token) {
  const userRole = normalizeRole(user?.role || user?.rol);
  if (userRole === "ROLE_ADMIN") return true;
  if (String(user?.email || "").toLowerCase() === "admin@vuelos.com") return true;

  const tokenRoles = readTokenRoles(token);
  return tokenRoles.includes("ROLE_ADMIN");
}
