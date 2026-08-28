/** Session state lives in memory only — never localStorage. SRS 3.5.1.
 *
 * core-api authenticates with an httpOnly session cookie and requires every
 * state-changing request to carry the CSRF token it returns at login/register
 * and on every session read. The access-token era is gone, so these two are
 * kept together for symmetry of ownership. */
let csrfToken: string | null = null;

export const getCSRFToken = () => csrfToken;
export const setCSRFToken = (token: string | null) => {
  csrfToken = token;
};
