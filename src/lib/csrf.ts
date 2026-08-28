let csrfToken: string | null = null;

export const getCsrfToken = () => csrfToken;
export const setCsrfToken = (value: string | null) => { csrfToken = value; };
