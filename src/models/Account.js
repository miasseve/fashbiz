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
  percentage: {
    type: String,
    default:null
  },
  isAccountComplete: {
    type: Boolean,
    default: false, 
  },
  //brand reward amt per product
  reeCollectAmount: {
    type: Number,
    default: 0,
  },
  //if brand has taken collect subscription
  collect: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.models.Account ||
  mongoose.model("Account", AccountSchema);
