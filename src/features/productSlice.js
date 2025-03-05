// src/features/productSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  consignor: {},
  uploadedImages: [],
  properties: [], 
};

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    setUploadedImagesOfProduct: (state, action) => {
      console.log(action.payload,'action.payload')
      state.uploadedImages = action.payload;
    },
    setPropertiesOfProduct: (state, action) => {
      state.properties = action.payload;
    },
    clearProductState: (state) => {
      state.uploadedImages = [];
      state.properties = [];
    },
    setConsignors: (state, action) => {
      state.consignor = action.payload;
    },
    clearConsignors: (state) => {
      state.consignor = {};
    },
    removeUploadedImagesByIndex: (state, action) => {
      const index = action.payload; // Get the index from the payload
      if (index >= 0 && index < state.uploadedImages.length) {
        state.uploadedImages=state.uploadedImages.splice(index, 1); // Remove the object at the specified index
      }
    },
    removePropertyByIndex: (state, action) => {
      const index = action.payload; // Get the index from the payload
      if (index >= 0 && index < state.properties.length) {
        state.properties=state.properties.splice(index, 1); // Remove the object at the specified index
      }
    }
  },
});

export const {
  setUploadedImagesOfProduct,
  clearConsignors,
  setConsignors,
  setPropertiesOfProduct,
  setError,
  setIsLoading,
  clearProductState,
  removePropertyByIndex,
  removeUploadedImagesByIndex
} = productSlice.actions;

export default productSlice.reducer;
