import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isModalOpened: false,
};


const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    openModal: (state, action) => {
      state.isModalOpened = action.payload;
    },
    closeModal: (state) => {
      state.isModalOpened = false;
    },
  },
});

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;