"use client";
import React from "react";
import { HeroUIProvider } from "@heroui/react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "@/store";
const Providers = ({ children }) => {
  return (
    <HeroUIProvider>
      <Provider store={store}>
        {" "}
        <PersistGate loading={null} persistor={persistor}>
          {children}{" "}
        </PersistGate>
      </Provider>
    </HeroUIProvider>
  );
};

export default Providers;
