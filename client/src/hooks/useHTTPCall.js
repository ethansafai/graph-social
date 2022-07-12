import { useCallback } from "react";
import useRefresh from "./useRefresh";

const useHTTPCall = (func) => {
  const refresh = useRefresh();

  const callHTTP = async () => {
    try {
      await func();
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await refresh();
          await func();
        } catch (error) {
          console.log(error);
        }
      }
    }
  };

  return useCallback(callHTTP, [func, refresh]);
};

export default useHTTPCall;
