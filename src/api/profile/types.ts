/**
 * Self-service "my account" profile update. Neither the RN app nor the web
 * reference has a confirmed dedicated endpoint for a user editing their own
 * record — the web app only has a read (`GET account/userprofile/`, see
 * `Api/authAPI.js`'s `fetchUserDetails`). Per instruction this reuses
 * `PATCH account/tenant/users` (web: `Api/cmsAPI.js` `editTenantUsers`),
 * whose only confirmed live usage is an admin editing OTHER tenant users
 * (Vite `Containers/Cms/AddUser/AddModal` — role/group fields included).
 * Using it for self-edit is UNVERIFIED — confirm the backend accepts/returns
 * the caller's own record via this same endpoint.
 */
export type UpdateOwnProfilePayload = {
  id: number;
  name?: string;
  email?: string;
  phone_number?: string;
};
