import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  materials: [],
};

const materialSlice = createSlice({
  name: "materials",
  initialState,
  reducers: {
    setMaterials: (state, action) => {
      state.materials = action.payload;
      // state.loading = false;
    },
  },
});

export const { setMaterials } = materialSlice.actions;
export default materialSlice.reducer;
