export const ETHIOPIAN_PHONE_REGEX = /^(09|07)\d{8}$/;

export const isValidEthiopianPhone = (value) => {
  if (value === null || value === undefined) return false;
  return ETHIOPIAN_PHONE_REGEX.test(String(value).trim());
};

// Strip everything except digits and cap at 10 characters
export const sanitizePhoneInput = (value) => {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
};