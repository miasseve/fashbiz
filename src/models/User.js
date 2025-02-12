import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    profileImage:{
      url: { type: String },
      publicId: { type: String}
    },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    storename:{ type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },  
    image: String,
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    emailVerified: Date,
});
  
export default mongoose.models.User || mongoose.model("User", UserSchema);
