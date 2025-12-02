import mongoose from "mongoose";

const FabricOptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,   
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,  
    },
  },
  { timestamps: true }
);

export default mongoose.models.FabricOption ||
  mongoose.model("FabricOption", FabricOptionSchema);
