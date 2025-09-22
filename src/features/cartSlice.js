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

    removeProductById: (state, action) => {
      const idToRemove = action.payload;
      const productToRemove = state.products.find(
        (product) => product._id === idToRemove
      );

      if (productToRemove) {
        state.products = state.products.filter(
          (product) => product._id !== idToRemove
        );
        state.total -= productToRemove.price;

        if (state.total < 0) {
          state.total = 0;
        }
      }
    },

      updateProductInCart: (state, action) => {
      const { _id, updatedData } = action.payload;
      const productIndex = state.products.findIndex(
        (product) => product._id === _id
      );

      if (productIndex !== -1) {
        // Subtract old price
        state.total -= state.products[productIndex].price;

        // Update product with new data
        state.products[productIndex] = {
          ...state.products[productIndex],
          ...updatedData,
        };

        // Add new price
        state.total += state.products[productIndex].price;
      }
    },


  },
});

export const { addProductToCart, removeProductFromCart, setTotal, clearCart,removeMultipleProductsFromCart,updateProductInCart,removeProductById} =
  cartSlice.actions;

export default cartSlice.reducer;
