// src/store.js
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import productReducer from "./features/productSlice"; // Import the product slice
import cartReducer from "./features/cartSlice"; // Import the product slice
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Uses localStorage for persistence
// Configuration for redux-persist
const persistConfig = {
  key: "root",
  storage,
};

const rootReducer = combineReducers({
  product: productReducer,
  cart: cartReducer,
});
const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable serializable check
    }),
});
export const persistor = persistStore(store);
export default store;
