import mongoose from "mongoose";

const AccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true,
  },
  accountId: {
    type: String,
    required: true,
    unique: true,
  },
  isAccountComplete: {
    type: Boolean,
    default: false, 
  },
});

export default mongoose.models.Account ||
  mongoose.model("Account", AccountSchema);
