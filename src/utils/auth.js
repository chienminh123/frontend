export function decodeJwt(token) {
    try {
      const payloadBase64 = token.split(".")[1];
      const json = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(json);
  
      const role =
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
        payload.role ||
        payload.Roles ||
        "";
  
      const name =
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
        payload.unique_name ||
        payload.sub ||
        "";
  
      const userId =
        payload["nameid"] ||
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
        "";
  
      const exp = payload.exp ? payload.exp * 1000 : null;
      const isExpired = exp ? Date.now() > exp : false;
  
      return { role, name, userId, exp, isExpired, raw: payload };
    } catch {
      return { role: "", name: "", userId: "", exp: null, isExpired: true, raw: null };
    }
  }
  
  export function getCurrentUser() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const info = decodeJwt(token);
    if (!info.role || info.isExpired) {
      localStorage.removeItem("token");
      return null;
    }
    return { ...info, token };
  }

  export function getCurrentClientUser() {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const info = decodeJwt(token);
    if (info.isExpired) {
      localStorage.removeItem("token");
      return null;
    }
    // Client token có thể chỉ có role Customer và name là SĐT
    const idFromCustomClaim = info?.raw?.Id || info?.raw?.id || "";
    return {
      ...info,
      userId: info.userId || idFromCustomClaim,
      token,
    };
  }