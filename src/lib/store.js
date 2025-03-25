import { configureStore } from "@reduxjs/toolkit";
import materialReducer from "@/redux/materialSlice";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";


// Configuration for redux-persist
const persistConfig = {
  key: "root",
  storage,
};

// Wrap the material reducer with persistReducer
const persistedMaterialReducer = persistReducer(persistConfig, materialReducer);


export const store = configureStore({
  reducer: {
    materials: persistedMaterialReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Required for redux-persist
    }),
});

export const persistor = persistStore(store);