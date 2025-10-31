import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    title: { type: String, required: true },
    images: [
        {
            url: { type: String },
            publicId: { type: String },
        },
    ],
    price: {
        type: Number,
        required: true,
    },
});

const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [cartItemSchema],
        total: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    { timestamps: true }
);

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);
export default Cart;
