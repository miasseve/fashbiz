// src/features/productSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  consignor: {},
  uploadedImages: [],
  properties: []
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setUploadedImagesOfProduct: (state, action) => {
      state.uploadedImages = action.payload;
    },
    setPropertiesOfProduct: (state, action) => {
      state.properties = action.payload; // Update properties array
    },
    clearProductState: (state) => {
      state.uploadedImages = [];
      state.properties = [];
    },
    setConsignors:(state, action)=>{
      state.consignor = action.payload
    },
    clearConsignors: (state) => {
      state.consignor = {};
    },
  },
});

export const { setUploadedImagesOfProduct, clearConsignors, setConsignors, setPropertiesOfProduct, setError, setIsLoading, clearProductState } = productSlice.actions;

export default productSlice.reducer;
