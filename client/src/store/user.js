import { createSlice } from "@reduxjs/toolkit";

const initialUser = localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user"))
  : null;

const user = createSlice({
  name: "user",
  initialState: {
    user: initialUser,
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    logoutSuccess: (state) => {
      state.user = null;
      localStorage.removeItem("user");
    },
    refreshTokenSuccess: (state, action) => {
      state.user.accessToken = action.payload;
      localStorage.setItem("user", JSON.stringify(state.user));
    },
    setSelfSuccess: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },
});

export default user.reducer;

const { loginSuccess, logoutSuccess, refreshTokenSuccess, setSelfSuccess } =
  user.actions;

export const login = (user) => (dispatch) => {
  dispatch(loginSuccess(user));
};

export const logout = () => (dispatch) => {
  dispatch(logoutSuccess());
};

export const refreshToken = (accessToken) => (dispatch) => {
  dispatch(refreshTokenSuccess(accessToken));
};

export const setSelf = (data) => async (dispatch) => {
  dispatch(setSelfSuccess(data));
};
