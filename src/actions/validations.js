import * as Yup from "yup";

export const registerSchema = Yup.object({
  firstname: Yup.string().trim().required("First name is required"),
  lastname: Yup.string().trim().required("Last name is required"),
  contactTitle: Yup.string().when("role", {
    is: "brand",
    then: () =>
      Yup.string()
        .trim()
        .required("Contact Person Title is required")
        .max(50, "Title cannot exceed 50 characters"),
    otherwise: () => Yup.string().nullable(),
  }),
  brandname: Yup.string().when("role", {
    is: "brand",
    then: () => Yup.string().trim().required("Brand Name is required"),
    otherwise: () => Yup.string(),
  }),
  legalCompanyName: Yup.string().when("role", {
    is: "brand",
    then: () => Yup.string().trim().required("Legal Company Name is required"),
    otherwise: () => Yup.string(),
  }),
  companyWebsite: Yup.string().when("role", {
    is: "brand",
    then: () =>
      Yup.string()
        .trim()
        .url("Must be a valid URL")
        .required("Company Website is required"),
    otherwise: () => Yup.string(),
  }),
  companyNumber: Yup.string().when("role", {
    is: "brand",
    then: () =>
      Yup.string()
        .trim()
        .matches(
          /^[A-Za-z0-9\s\-\/]+$/,
          "Enter a valid company registration number"
        )
        .required("Company Registration Number is required"),
    otherwise: () => Yup.string(),
  }),
  country: Yup.string().when("role", {
    is: (role) => role === "brand" || role === "store",
    then: () => Yup.string().required("Country is required"),
    otherwise: () => Yup.string().nullable(),
  }),
  storename: Yup.string().when("role", {
    is: "store",
    then: () => Yup.string().trim().required("Store name is required"),
    otherwise: () => Yup.string(),
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
      ["store", "consignor", "brand"],
      'Invalid role. Role must be "store", "consignor", or "brand"'
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
  contactTitle: Yup.string().when("role", {
    is: "brand",
    then: () => Yup.string().required("Contact Title is required"),
    otherwise: () => Yup.string(),
  }),
  brandname: Yup.string().when("role", {
    is: "brand",
    then: () => Yup.string().required("Brand Name is required"),
    otherwise: () => Yup.string(),
  }),
  legalCompanyName: Yup.string().when("role", {
    is: "brand",
    then: () => Yup.string().required("Legal Company Name is required"),
    otherwise: () => Yup.string(),
  }),
  companyWebsite: Yup.string().when("role", {
    is: "brand",
    then: () => Yup.string().url().required("Company Website is required"),
    otherwise: () => Yup.string(),
  }),
  companyNumber: Yup.string().when("role", {
    is: "brand",
    then: () =>
      Yup.string()
        .matches(
          /^[A-Za-z0-9\s\-\/]+$/,
          "Enter a valid company registration number"
        )
        .required("Company Registration Number is required"),
    otherwise: () => Yup.string(),
  }),
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
  size: Yup.string().required("Size is required"),
  fabric: Yup.string().optional(),
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
  pointsValue: Yup.number()
    .typeError("Points Value must be a number")
    .min(0, "Points Value cannot be negative")
    .max(1400, "Points Value cannot exceed 1400"),
  subcategory: Yup.string().required("Subcategory is required"),
  description: Yup.string().required("Description is required"),
  size: Yup.string().required("Size is required"),
  fabric: Yup.string().optional(),
});

export const getPointRuleForProduct = (category, brandType, rules) => {
  if (!category || !brandType || !rules || rules.length === 0) {
    return null;
  }

  // Find exact match for category and brandType
  const rule = rules.find(
    (r) => r.category === category && r.brandType === brandType
  );

  return rule || null;
};
// Create dynamic validation schema based on the rule
export const createPointsSchema = (rule) => {
  if (!rule) {
    return Yup.object().shape({
      points: Yup
        .number()
        .required("Points are required")
        .min(0, "Points cannot be negative"),
    });
  }

  // If the rule has fixedPoints, only allow that exact value
  if (rule.fixedPoints !== undefined && rule.fixedPoints !== null) {
    return Yup.object().shape({
      points: Yup
        .number()
        .required("Points are required")
        .oneOf(
          [rule.fixedPoints],
          `Points must be exactly ${rule.fixedPoints} for this category and brand type`
        ),
    });
  }

  // If the rule has a range (minPoints and maxPoints)
  if (rule.minPoints !== undefined && rule.maxPoints !== undefined) {
    return Yup.object().shape({
      points: Yup
        .number()
        .required("Points are required")
        .min(rule.minPoints, `Points must be at least ${rule.minPoints}`)
        .max(rule.maxPoints, `Points cannot exceed ${rule.maxPoints}`),
    });
  }

  // Fallback
  return Yup.object().shape({
    points: Yup
      .number()
      .required("Points are required")
      .min(0, "Points cannot be negative"),
  });
};

export const getPointRuleDisplayText = (rule) => {
  if (!rule) {
    return "No rule found for this category and brand type";
  }

  if (rule.fixedPoints !== undefined && rule.fixedPoints !== null) {
    return `Fixed Points: ${rule.fixedPoints}`;
  }

  if (rule.minPoints !== undefined && rule.maxPoints !== undefined) {
    return `Allowed Range: ${rule.minPoints} - ${rule.maxPoints} points`;
  }

  return "Rule information not available";
};