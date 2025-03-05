// src/features/productSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  total: 0,
  products: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addProductToCart: (state, action) => {
      const productExists = state.products.some(
        (product) => product._id === action.payload._id
      );
      if (!productExists) {
        state.products.push(action.payload);
        state.total += action.payload.price;
      }
    },
    setTotal: (state, action) => {
      state.total = action.payload;
    },
    clearCart: (state) => {
      state.total = 0;
      state.products = [];
    },
    removeProductFromCart: (state, action) => {
      state.products = state.products.filter(
        (product) => product._id !== action.payload._id
      );
      if (state.products.length === 0) {
        state.total = 0;
      } else {
        state.total -= action.payload.price;
      }
    },
  },
});

export const { addProductToCart, removeProductFromCart, setTotal, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;
