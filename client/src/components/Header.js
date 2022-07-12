import { useSelector, useDispatch } from "react-redux";
import { logout, setSelf } from "../store/user";
import store from "../store";
import useHTTPCall from "../hooks/useHTTPCall";
import client from "../config/client";
import { useCallback, useEffect, useRef, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import { UserCircleIcon } from "@heroicons/react/solid";
import { useNavigate } from "react-router-dom";

import "./Header.css";

const Header = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(user);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const d = new Date();
  const greeting =
    d.getHours() < 12
      ? "Good Morning"
      : d.getHours() < 18
      ? "Good Afternoon"
      : "Good Evening";

  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setOpen(false);
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    setLoggingOut(true);
    const { user: updatedUser } = store.getState().user;

    await client.post(
      "/users/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${updatedUser.accessToken}`,
        },
      }
    );
  };

  const logoutCall = useHTTPCall(
    useCallback(async () => {
      await logoutUser();
      dispatch(logout());
      navigate("/auth");
    }, [dispatch, navigate])
  );

  const handleRoute = (route) => {
    setOpen(false);
    navigate(route);
  };

  const handleLogout = async () => await logoutCall();

  const getSelf = async () => {
    setLoading(true);
    const { user: updatedUser } = store.getState().user;
    const { data } = await client.get("/users/self", {
      headers: {
        Authorization: `Bearer ${updatedUser.accessToken}`,
      },
    });
    dispatch(setSelf(data));
    setUserData(data);
    setLoading(false);
  };

  const selfCall = useHTTPCall(useCallback(getSelf, [dispatch]));

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    const { user: currentUser } = store.getState().user;
    if (currentUser) {
      selfCall();
    }

    store.subscribe(() => {
      const { user: currentUser } = store.getState().user;
      setUserData(currentUser);
    });

    return () => {
      setUserData(null);
      setLoading(false);
      setLoggingOut(false);
      setOpen(false);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selfCall]);

  return (
    <header
      className="fixed top-0 left-0 bg-blue-500 w-full p-2 text-white 
    flex items-center h-[4.75rem] shadow-md"
    >
      <div
        className="flex justify-center items-center w-full max-w-6xl mx-auto 
      header p-2 inner-container"
      >
        {loading ? (
          <div className="flex justify-center w-52 mx-auto gap-2">
            {loggingOut && <p>Logging out...</p>}
            <LoadingSpinner />
          </div>
        ) : userData ? (
          <div className="flex w-full justify-start items-center mx-auto">
            <button onClick={handleLogout}>Logout</button>
            <p className="hidden md:block text-center text-lg font-medium">
              {greeting},{" "}
              {userData?.name?.substring(0, userData?.name?.indexOf(" "))}
            </p>
            <div className="w-20 md:w-28 grow justify-end flex">
              <UserCircleIcon
                className={`w-10 cursor-pointer hover:text-gray-300 ${
                  open && ""
                }`}
                onClick={() => setOpen(true)}
              />
              {open && (
                <div
                  className="absolute bg-white shadow-md rounded-lg dropdown
                  top-16"
                  ref={dropdownRef}
                >
                  <p onClick={() => handleRoute("/")}>Profile</p>
                  <div className="border-b border-gray-300"></div>
                  <p
                    onClick={() => handleRoute("/likedPosts")}
                    className="md:hidden"
                  >
                    Liked Posts
                  </p>
                  <div className="border-b border-gray-300"></div>
                  <p
                    onClick={() => handleRoute("/search")}
                    className="md:hidden"
                  >
                    Search
                  </p>
                  <div className="md:hidden border-b border-gray-300"></div>
                  <p
                    onClick={() => handleRoute("/upload")}
                    className="md:hidden"
                  >
                    Post
                  </p>
                  <div className="md:hidden border-b border-gray-300"></div>
                  <p onClick={() => handleRoute("/feed")} className="md:hidden">
                    Feed
                  </p>
                  <div className="md:hidden border-b border-gray-300"></div>
                  <p onClick={handleLogout}>Logout</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <h1 className="text-xl font-semibold">Graph Social</h1>
        )}
      </div>
    </header>
  );
};

export default Header;
