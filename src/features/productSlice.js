// src/features/productSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { set } from "mongoose";

const initialState = {
  consignor: {},
  currentStep: 1,
  uploadedImages: {
    frontView: null,
    sideView: null,
    backView: null,
    detailView: null,
  },
};

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    setUploadedImagesOfProduct: (state, action) => {
      state.uploadedImages = action.payload;
    },
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload; 
    },
    clearProductState: (state) => {
      state.uploadedImages = {};
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
        state.uploadedImages = state.uploadedImages.splice(index, 1); // Remove the object at the specified index
      }
    },
  },
});

export const {
  setUploadedImagesOfProduct,
  clearProductState,
  setConsignors,
  clearConsignors,
  removeUploadedImagesByIndex,
  setCurrentStep
} = productSlice.actions;

export default productSlice.reducer;
