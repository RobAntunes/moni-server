export type Response = {
  success: boolean;
  status: 200 | 201 | 302 | 307 | 400 | 401 | 403 | 404 | 500;
  message: string;
};
