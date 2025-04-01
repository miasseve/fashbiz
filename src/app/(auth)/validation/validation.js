// utils/validation.js 

export const validatePassword = (value) => {
    if (!value) {
      return "Password is required";
    }
    if (value.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/\d/.test(value)) {
      return "Password must contain a digit";
    }
    if (!/[a-z]/.test(value)) {
      return "Password must contain a lowercase letter";
    }
    if (!/[A-Z]/.test(value)) {
      return "Password must contain an uppercase letter";
    }
    if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(value)) {
      return "Password must contain a special character";
    }
    if (value.length > 50) {
      return "Password can be at most 50 characters";
    }
    return true; // Valid password
  };
  