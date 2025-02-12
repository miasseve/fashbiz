"use server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import cloudinary from "@/lib/cloudinary";
import { signIn, signOut } from "@/auth";

export async function registerUser(data) {
  try {
    await dbConnect();
    const { firstname, lastname, storename, email, password } = data;

    // Step 1: Validate firstname, lastname, and storename
    isValidField(firstname, "First name");
    isValidField(lastname, "Last name");
    isValidField(storename, "Store name");

    // Step 2: Validate email format
    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    // Step 3: Validate password strength
    if (!isValidPassword(password)) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Step 4: Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { status: 400, error: "User already exists" };
    }

    // Step 5: Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 6: Create the new user
    const user = new User({
      firstname,
      lastname,
      storename,
      email,
      password: hashedPassword, // Store the hashed password
    });

    const savedUser = await user.save(); // Save the user to the database
    return { status: 200, data: JSON.stringify(savedUser) }; // Success response with status 200
  } catch (error) {
    console.log(error);

    // Return error message along with a 400 status code
    return { status: 400, error: error.message || "Something went wrong" };
  }
}

export async function signOutUser() {
  await signOut({ redirectTo: "/" });
}

const isValidField = (field, fieldName) => {
  if (!field || field.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }
  return field;
};
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

// Helper function to validate password
function isValidPassword(password) {
  return password.length >= 6;
}

export async function signInUser(data) {
  try {
    const { email, password } = data;

    // Validate email and password on the server
    if (!isValidEmail(email)) {
      return { status: 400, error: "Invalid email format" };
    }

    if (!isValidPassword(password)) {
      return {
        status: 400,
        error: "Password must be at least 6 characters long",
      };
    }

    const result = await signIn("credentials", {
      email: email,
      password: password,
      redirect: false,
    });

    if (result?.error) {
      return { status: 401, error: "Invalid credentials" };
    }

    return {
      status: 200,
      message: "Logged in successfully",
    };
  } catch (err) {
    return { status: 500, error: "Internal server error" };
  }
}

export async function getUserById(userId) {
  try {
    // Step 1: Validate the userId
    if (!userId || typeof userId !== "string") {
      return { status: 400, error: "Invalid user ID" };
    }

    // Step 2: Connect to the database
    await dbConnect();

    // Step 3: Fetch the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return { status: 404, error: "User not found" };
    }

    // Step 4: Return the user data
    return {
      status: 200,
      data: JSON.stringify(user), // Return the user object (Mongoose model instance)
    };
  } catch (err) {
    console.error(err);
    // Return an error message for unexpected errors
    return { status: 500, error: "Internal server error" };
  }
}

export async function updateUserById(userId, updatedData) {
  try {
    // Step 1: Validate the userId
    if (!userId || typeof userId !== "string") {
      return { status: 400, error: "Invalid user ID" };
    }

    // Step 2: Validate the updated data (if needed, you can add validation here)
    if (!updatedData || typeof updatedData !== "object") {
      return { status: 400, error: "Invalid updated data" };
    }

    // Step 3: Connect to the database
    await dbConnect();

    // Step 4: Update the user by ID
    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true, // Return the updated document instead of the original
      runValidators: true, // Ensure validation is run on the updated data
    });

    if (!updatedUser) {
      return { status: 404, error: "User not found" };
    }

    // Step 5: Return the updated user data
    return {
      status: 200,
      data: JSON.stringify(updatedUser), // Return the updated user object
    };
  } catch (err) {
    console.error(err);
    // Return an error message for unexpected errors
    return { status: 500, error: "Internal server error" };
  }
}

export async function removeProfile(userId) {
  try {
    // Step 1: Validate the userId
    if (!userId || typeof userId !== "string") {
      return { status: 400, error: "Invalid user ID" };
    }

    // Step 2: Connect to the database
    await dbConnect();

    const user = await User.findById(userId);
    if (!user) {
      return { status: 404, error: "User not found" };
    }

    if (!user.profileImage || !user.profileImage.publicId) {
      return { status: 400, error: "No profile image to remove" };
    }

    const publicId = user.profileImage.publicId;

    const deleteResponse = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    if (deleteResponse.result !== "ok") {
      return { status: 500, error: "Failed to remove image from Cloudinary" };
    }

    // Step 5: Update the user record in the database by removing the profile image
    user.profileImage = {}; // Clear the profileImage field
    await user.save();

    // Step 4: Return a success message
    return {
      status: 200,
      message: "Profile removed successfully",
    };
  } catch (err) {
    console.error(err);
    // Return an error message for unexpected errors
    return { status: 500, error: "Internal server error" };
  }
}
