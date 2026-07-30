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
