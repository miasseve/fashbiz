import * as Yup from "yup";

export const registerSchema = Yup.object({
  firstname: Yup.string().trim().required("First name is required"),
  lastname: Yup.string().trim().required("Last name is required"),
  storename: Yup.string().when("role", {
    is: "store",
    then: () => Yup.string().trim().required("Store name is required"),
    otherwise: () => Yup.string(),
  }),
  country: Yup.string().when("role", {
    is: "store",
    then: () => Yup.string().required("Country is required"),
    otherwise: () => Yup.string().nullable(),
  }),
  businessNumber: Yup.string().when("role", {
    is: "store",
    then: () =>
      Yup.string()
        .trim()
        .matches(
          /^\d+$/,
          "LE-stores is for professional stores only. Please enter a valid company VAT/CVR number."
        )
        .required("Business Registration Number is required"),
    otherwise: () => Yup.string().nullable(),
  }),
  phone: Yup.string().required("Phone number is required"),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters long")
    .required("Password is required"),
  role: Yup.string()
    .oneOf(
      ["store", "consignor"],
      'Invalid role. Role must be "store" or "consignor"'
    )
    .required("Role is required")
    .default("consignor"),
});

export const loginSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export const profileSchema = Yup.object({
  firstname: Yup.string().trim().required("First name is required"),
  lastname: Yup.string().trim().required("Last name is required"),
  storename: Yup.string().when("role", {
    is: "store",
    then: () => Yup.string().trim().required("Store name is required"),
    otherwise: () => Yup.string(),
  }),
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  phone: Yup.string().required("Phone number is required"),
  address: Yup.string().trim().required("Address is required"),
  city: Yup.string().trim().required("City is required"),
  zipcode: Yup.string().when("country", {
    is: "DK",
    then: () =>
      Yup.string()
        .matches(/^\d{4}$/, "Zipcode must be 4 digits")
        .required("Zipcode is required"),
    otherwise: () =>
      Yup.string()
        .matches(/^[a-zA-Z0-9\s\-]{3,10}$/, "Enter a valid postal/zip code")
        .required("Zipcode is required"),
  }),
  state: Yup.string().trim().required("State is required"),
  country: Yup.string().trim().required("Country is required"),
});

export const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long")
    .max(50, "Password can be at most 50 characters")
    .test(
      "password-strength",
      "Password must contain at least one digit, one lowercase letter, one uppercase letter, and one special character.",
      (value) => {
        const hasDigit = /\d/.test(value);
        const hasLowercase = /[a-z]/.test(value);
        const hasUppercase = /[A-Z]/.test(value);
        const hasSpecialChar = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(value);
        return hasDigit && hasLowercase && hasUppercase && hasSpecialChar;
      }
    ),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords do not match")
    .required("Confirm Password is required"),
});

export const productSchema = Yup.object().shape({
  collectionId: Yup.string().required("Category is required"),
  sku: Yup.string().required("SKU is required"),
  title: Yup.string().required("Title is required"),
  brand: Yup.string().required("Brand is required"),
  price: Yup.number()
    .typeError("Price must be a number")
    .required("Price is required")
    .positive("Price must be greater than zero")
    .test(
      "max-2-decimals",
      "Price can have at most 2 decimal places",
      (value) => /^\d+(\.\d{1,2})?$/.test(String(value))
    ),
  color: Yup.object({
    name: Yup.string().required("Color name is required"),
    hex: Yup.string(),
  }),
  subcategory: Yup.string().required("Subcategory is required"),
  description: Yup.string().required("Description is required"),
});

export const updateProductSchema = Yup.object().shape({
  sku: Yup.string().required("SKU is required"),
  title: Yup.string().required("Title is required"),
  brand: Yup.string().required("Brand is required"),
  price: Yup.number()
    .typeError("Price must be a number")
    .required("Price is required")
    .positive("Price must be greater than zero")
    .test(
      "max-2-decimals",
      "Price can have at most 2 decimal places",
      (value) => /^\d+(\.\d{1,2})?$/.test(String(value))
    ),
  subcategory: Yup.string().required("Subcategory is required"),
  description: Yup.string().required("Description is required"),
});
