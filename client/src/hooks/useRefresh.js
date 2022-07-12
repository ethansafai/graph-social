import client from "../config/client";
import { useSelector, useDispatch } from "react-redux";
import { refreshToken } from "../store/user";
import { useCallback } from "react";

const useRefresh = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const refresh = async () => {
    try {
      const { data } = await client.post("/users/token", {
        refreshToken: user?.refreshToken,
      });

      dispatch(refreshToken(data.accessToken));
    } catch (error) {
      console.log(error);
    }
  };

  // useCallback is used to memoize the function so that it doesn't
  // re-run every time the component is rendered (referential equality
  // phenomenon)
  return useCallback(refresh, [dispatch, user?.refreshToken]);
};

export default useRefresh;
