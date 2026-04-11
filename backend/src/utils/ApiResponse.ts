export const apiResponse = <T>(data: T, message?: string) => ({
  success: true,
  message,
  ...data,
});
