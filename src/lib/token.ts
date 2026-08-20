/** Access token lives in memory only — never localStorage. SRS 3.5.1. */
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
