// changes in this file
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    profileImage: {
        url: { type: String },
        publicId: { type: String }
    },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    storename: { 
        type: String,
        required: function() { return this.role === "store"; } 
    },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },  
    phoneNumber: { type: String },
    address: { type: String },
    city: { type: String },  // Added city
    state: { type: String }, // Added state
    zipcode: { type: String }, // Added zipcode
    country: { type: String },
    image: String,
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    role: { 
        type: String, 
        required: true,
        enum: ["store", "consignor"], 
    },
    emailVerified: Date,
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: String, default: null },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
