export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
};

export const generateSecureOTP = (length: number = 6): string => {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += (array[i] % 10).toString();
  }
  
  return otp;
};
