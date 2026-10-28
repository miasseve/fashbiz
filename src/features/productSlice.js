// src/features/productSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { set } from "mongoose";

const initialState = {
  consignor: {},
  currentStep: 1,
  // Ordered list of uploaded product photos ({ url, publicId, ... }), in the
  // order the owner added them. The first photo is treated as the main one
  // by the AI analysis. (Previously a fixed { frontView, sideView, ... } object.)
  uploadedImages: [],
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
      state.uploadedImages = [];
    },
    setConsignors: (state, action) => {
      state.consignor = action.payload;
    },
    clearConsignors: (state) => {
      state.currentStep = 1;
      state.consignor = {};
    },
  },
});

export const {
  setUploadedImagesOfProduct,
  clearProductState,
  setConsignors,
  clearConsignors,
  setCurrentStep
} = productSlice.actions;

export default productSlice.reducer;
