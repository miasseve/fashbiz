"use server";
import * as Yup from "yup";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import Account from "@/models/Account";
import User from "@/models/User";
import { auth } from "@/auth";
import cloudinary from "@/lib/cloudinary";
import { profileSchema } from "./validations";
import { signIn, signOut } from "@/auth";
import crypto from "crypto";
import nodemailer from "nodemailer";
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
} from "./validations";
import dayjs from "dayjs";
import { sendResetPasswordEmail } from "@/mails/forgotPassword";
import ActiveUser from "@/models/Activeuser";
import { getInternetIp } from "./getClientIp";

export async function registerUser(data) {
  try {
    await dbConnect();
    const {
      firstname,
      lastname,
      contactTitle,
      companyNumber,
      companyWebsite,
      legalCompanyName,
      brandname,
      storename,
      email,
      password,
      role,
      country,
      businessNumber,
      phone,
    } = data;

    let subscriptionData = {};
    if (role === "store") {
      const subscriptionStart = new Date();
      const subscriptionEnd = dayjs(subscriptionStart).add(14, "day").toDate();
      subscriptionData = {
        subscriptionType: "free",
        subscriptionStart,
        subscriptionEnd,
        isActive: true,
      };
    }

    await registerSchema.validate(data, { abortEarly: false });

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return { status: 400, error: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      firstname,
      lastname: role === "brand" ? undefined : lastname,
      email,
      password: hashedPassword,
      role,
      phone: phone || undefined,

      // Save country ONLY for brand + store
      country: role === "store" || role === "brand" ? country : undefined,

      // Store fields
      ...(role === "store" && {
        storename,
        businessNumber,
        ...subscriptionData,
      }),

      // Brand fields
      ...(role === "brand" && {
        contactTitle,
        companyNumber,
        companyWebsite,
        legalCompanyName,
        brandname,
      }),
    });

    const savedUser = await user.save();
    return { status: 200, data: JSON.stringify(savedUser) };
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      return {
        status: 400,
        error: error.errors.join(", "),
      };
    }

    return {
      status: 400,
      error: error.message || "Something went wrong",
    };
  }
}
export async function signOutUser({ callbackUrl = "/" } = {}) {
  try {
    await dbConnect();
    const session = await auth();
    const userId = session?.user?.id;
    console.log("session is:", session);
    if (session?.user?.role === "store") {
      if (userId) {
        await ActiveUser.deleteMany({ userId });
      } else {
        console.warn("Missing userId during logout for store user");
      }
      //under Consideration to track IP for store users
      // const ipAddress = await getInternetIp();
      // if (userId && ipAddress) {
      //   await ActiveUser.deleteOne({ userId, ipAddress });
      // } else {
      //   console.warn("Missing userId or IP address during logout");
      // }
    }
  } catch (error) {
    console.error("Error during cleanup before signout:", error);
  }

  return signOut({ redirectTo: callbackUrl });
}

export async function signInUser(data) {
  try {
    const { email, password } = data;

    await loginSchema.validate(data, { abortEarly: false });

    const result = await signIn("credentials", {
      email: email,
      password: password,
      redirect: false,
    });

    if (result?.error) {
      return { status: 401, error: "Invalid credentials" };
    }

    const user = await User.findOne({ email: email });

    return {
      status: 200,
      message: "Logged in successfully",
      profileStatus: user.isProfileComplete,
      role: user.role,
    };
  } catch (error) {
    console.log(error.message, "error");
    if (error instanceof Yup.ValidationError) {
      return {
        status: 400,
        error: error.errors.join(", "),
      };
    }

    return { status: 500, error: "Invalid Credentials" };
  }
}

export async function checkStripeIsConnected() {
  try {
    const session = await auth();
    if (!session) {
      return { status: 400, error: "Invalid User" };
    }
    await dbConnect();
    const account = await Account.findOne({ userId: session.user.id });
    if (!account) {
      return {
        status: 404,
        error:
          "Please connect your stripe account for secure payment processing.",
      };
    }

    if (!account.isAccountComplete) {
      return {
        status: 400,
        error: "Stripe is not connected please fill all the details",
      };
    }

    return {
      status: 200,
      data: JSON.stringify(account),
    };
  } catch (err) {
    return { status: 500, error: err.message || "Internal server error" };
  }
}
export async function getUser() {
  try {
    const session = await auth();
    if (!session) {
      return { status: 400, error: "Invalid User" };
    }

    await dbConnect();
    const user = await User.findById(session.user.id);

    if (!user) {
      return { status: 404, error: "User not found" };
    }
    return {
      status: 200,
      data: JSON.stringify(user),
    };
  } catch (err) {
    return { status: 500, error: "Internal server error" };
  }
}

export async function updateUser(updatedData) {
  try {
    const session = await auth();
    if (!session) {
      return { status: 400, error: "Invalid User" };
    }

    // Validate updated data using Yup
    await profileSchema.validate(updatedData, { abortEarly: false });

    // Connect to the database
    await dbConnect();

    // Update the user by ID
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { ...updatedData, isProfileComplete: true },
      {
        new: true, // Return the updated document instead of the original
        runValidators: true, // Ensure validation is run on the updated data
      }
    );

    if (!updatedUser) {
      return { status: 404, error: "User not found" };
    }

    return {
      status: 200,
      data: JSON.stringify(updatedUser), // Return the updated user object
    };
  } catch (err) {
    if (err instanceof Yup.ValidationError) {
      return {
        status: 400,
        error: err.errors.join(", "), // Join errors for easier reading
      };
    }

    return { status: 500, error: "Internal server error" };
  }
}

export async function removeProfile() {
  try {
    const session = await auth();
    if (!session) {
      return { status: 400, error: "Invalid User" };
    }

    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user) {
      return { status: 404, error: "User not found" };
    }

    if (!user.profileImage || !user.profileImage.publicId) {
      return { status: 400, error: "No profile image to remove" };
    }

    const publicId = user.profileImage.publicId;
    if (publicId) {
      // const resource = await cloudinary.api.resource(publicId);
      // console.log(resource,'resource');
      const deleteResponse = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });

      if (deleteResponse.result !== "ok") {
        return { status: 500, error: "Failed to remove image from Cloudinary" };
      }
    }
    user.profileImage = {};
    await user.save();

    return {
      status: 200,
      message: "Profile removed successfully",
    };
  } catch (err) {
    return { status: 500, error: "Internal server error" };
  }
}

export async function getAllStores() {
  try {
    const session = await auth();
    if (!session) {
      return { status: 400, error: "Invalid User" };
    }

    await dbConnect();
    const stores = await User.find({ role: "store" });

    return {
      status: 200,
      data: JSON.stringify(stores),
    };
  } catch (err) {
    return { status: 500, error: "Internal server error" };
  }
}

export async function sendEmail(payload) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: payload.email,
      subject: "🎉 Welcome to Our Community!",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; padding-bottom: 10px;">
                        <img src="https://yourwebsite.com/logo.png" alt="Your Website Logo" style="max-width: 150px;">
                    </div>
                    <h2 style="color: #333;">Welcome, ${
                      payload.firstname
                    }! 🎉</h2>
                    <p style="font-size: 16px; color: #555;">
                        Thank you for signing up with <strong>Your Website</strong>. We’re excited to have you on board! 🚀
                    </p>
                    <p style="font-size: 16px; color: #555;">
                        Here’s what you can do next:
                    </p>
                    <ul style="font-size: 16px; color: #555;">
                        <li>🌟 <a href="${
                          process.env.NEXT_PUBLIC_FRONTEND_URL
                        }/login" style="color: #007bff; text-decoration: none;">Log in</a> to your account</li>
                        <li>📖 Explore our <a href="${
                          process.env.NEXT_PUBLIC_FRONTEND_URL
                        }/getting-started" style="color: #007bff; text-decoration: none;">Getting Started Guide</a></li>
                        <li>💬 Join our <a href="${
                          process.env.NEXT_PUBLIC_FRONTEND_URL
                        }/community" style="color: #007bff; text-decoration: none;">Community Forum</a></li>
                    </ul>
                    <p style="font-size: 16px; color: #555;">
                        If you have any questions, feel free to reach out to us at <a href="mailto:support@yourwebsite.com" style="color: #mailto:007bff;">support@yourwebsite.com</a>.
                    </p>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${process.env.NEXT_PUBLIC_FRONTEND_URL}/login" 
                           style="background-color: #007bff; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px;">
                           Log in to Your Account
                        </a>
                    </div>
                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">
                    <p style="text-align: center; font-size: 14px; color: #777;">
                        &copy; ${new Date().getFullYear()} Your Website Name. All rights reserved.
                    </p>
                </div>
            `,
    };
    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: "Email sent successfully", info };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function forgotPassword(email) {
  await dbConnect();
  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return { status: 404, message: "User not found" };
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    const expirationDate = new Date(Date.now() + 5 * 60 * 1000);
    const localExpirationTime = expirationDate.getTime();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = localExpirationTime;

    await user.save();
    await sendResetPasswordEmail(user, resetToken);

    return {
      status: 200,
      message: "Password reset email sent!",
    };
  } catch (error) {
    return { status: 500, message: error.message };
  }
}

export async function verifypasswordToken(token) {
  await dbConnect();

  try {
    const user = await User.findOne({ resetPasswordToken: token });

    if (!user) {
      return { status: 404, error: "Invalid or expired token" };
    }

    const currentTime = Date.now();
    if (currentTime > user.resetPasswordExpires) {
      return { status: 400, error: "Token has expired" };
    }

    return { status: 200, message: "Token verified successfully!" };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

export async function resetPassword(token, password, confirmPassword) {
  await dbConnect();

  try {
    // Validate password input using Yup
    await resetPasswordSchema.validate(
      { password, confirmPassword },
      { abortEarly: false }
    );

    // Find user by reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return {
        status: 400,
        error: ["Invalid or expired token"],
      };
    }

    // Hash new password and save it
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { status: 200, message: "Password reset successfully!" };
  } catch (error) {
    if (error instanceof Yup.ValidationError) {
      return {
        status: 400,
        error: error.errors, // Send array of validation error messages
      };
    }
    return { status: 500, error: [error.message || "Internal Server Error"] };
  }
}

export async function getStoreOwnerDetail() {
  try {
    const session = await auth();
    if (!session) {
      throw new Error("User is not authenticated");
    }

    // Connect to the database
    await dbConnect();
    // Fetch the product by ID for the authenticated user
    const user = await User.findOne({
      _id: session.user.id,
    });

    if (!user) {
      throw new Error("User not found");
    }

    const account = await Account.findOne({ userId: session.user.id });

    return {
      status: 200,
      message: "Store Owner details fetched successfully",
      data: {
        user: JSON.stringify(user),
        account: JSON.stringify(account),
      },
    }; // Return the product details
  } catch (error) {
    return {
      status: 500, // Internal server error status code
      error: error.message || "Failed to fetch user",
    };
  }
}
