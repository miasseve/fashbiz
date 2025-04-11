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
    removeMultipleProductsFromCart: (state, action) => {
      const idsToRemove = action.payload;
    
      // Filter out the products that are NOT in the list of IDs to remove
      const filteredProducts = state.products.filter(
        (product) => !idsToRemove.includes(product._id)
      );
    
      // Calculate the new total
      const removedProducts = state.products.filter((product) =>
        idsToRemove.includes(product._id)
      );
    
      const removedTotal = removedProducts.reduce(
        (sum, product) => sum + product.price,
        0
      );
    
      state.products = filteredProducts;
      state.total -= removedTotal;
    
      if (state.total < 0) {
        state.total = 0;
      }
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

export const { addProductToCart, removeProductFromCart, setTotal, clearCart,removeMultipleProductsFromCart} =
  cartSlice.actions;

export default cartSlice.reducer;
