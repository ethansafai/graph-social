import { useState, useEffect } from "react";
import { login } from "../store/user";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import client from "../config/client";
import LoadingSpinner from "./LoadingSpinner";

import "./Auth.css";

const Auth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  const [errorMsg, setErrorMsg] = useState("");
  const [title, setTitle] = useState("Sign In");
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoadingMsg("");

    // Check for username and password
    if (!username || !password) {
      setErrorMsg("All fields are required");
      return;
    }

    if (isSignup) {
      // Check for name, email, and confirm password
      if (!name || !email || !confirmPassword) {
        setErrorMsg("All fields are required");
        return;
      }

      // Check for matching passwords
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match");
        return;
      }

      // Sign up user
      if (
        password.match(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        )
      ) {
        try {
          setLoading(true);
          setLoadingMsg("Logging you in...");
          const { data } = await client.post("/users/", {
            name,
            username,
            email,
            password,
          });
          dispatch(login(data));
          navigate("/");
        } catch (error) {
          setLoading(false);
          setErrorMsg(error.response.data.message);
        }
      } else {
        setErrorMsg(
          "Password must be at least 8 characters long and contain at least " +
            "one number, one uppercase letter, and one special character."
        );
      }
      return;
    }

    // Log in user
    try {
      setLoading(true);
      setLoadingMsg("Attempting log in...");
      const { data } = await client.post("/users/login", {
        username,
        password,
      });
      dispatch(login(data));
      navigate("/");
    } catch (error) {
      setLoading(false);
      setErrorMsg(error.response.data.message);
    }
  };

  const clearInputs = () => {
    setName("");
    setUsername("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isSignup) {
      setTitle("Sign Up");
    } else {
      setTitle("Sign In");
    }
    setErrorMsg("");
  }, [isSignup]);

  return (
    <div
      className="flex flex-col items-center pt-3 pb-2 max-w-xs mx-auto 
    bg-white auth shadow-sm"
    >
      <h2 className="font-medium text-xl">{title}</h2>
      <hr className="border-t border-slate-400 w-[80%] mt-2 mb-4" />
      <form className="flex flex-col gap-2 px-4" onSubmit={handleSubmit}>
        {isSignup && (
          <>
            <label htmlFor="name">Full Name:</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              spellCheck={false}
            />
          </>
        )}
        <label htmlFor="username">Username:</label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          spellCheck={false}
        />
        {isSignup && (
          <>
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              spellCheck={false}
            />
          </>
        )}
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {isSignup && (
          <>
            <label htmlFor="confirm-password">Confirm Password:</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </>
        )}

        {errorMsg && (
          <p
            className="bg-red-500 text-center text-white p-1 font-medium 
          text-sm mt-2"
          >
            {errorMsg}
          </p>
        )}

        <input
          className="bg-blue-500 text-white p-1 shadow-md cursor-pointer 
          my-4 text-center hover:bg-blue-700 transition-colors ease-in-out 
          duration-150"
          type="submit"
          value={title}
        />
        {loading && (
          <div className="mb-6">
            {loadingMsg && (
              <p className="text-center text-gray-500 mb-4">{loadingMsg}</p>
            )}
            <LoadingSpinner />
          </div>
        )}
      </form>
      {isSignup ? (
        <p className="text-center">
          Already have an account?{" "}
          <button
            onClick={() => {
              setIsSignup((prev) => !prev);
              clearInputs();
            }}
          >
            Sign In
          </button>
        </p>
      ) : (
        <p className="text-center">
          Don't have an account?{" "}
          <button
            onClick={() => {
              setIsSignup((prev) => !prev);
              clearInputs();
            }}
          >
            Sign Up
          </button>
        </p>
      )}
    </div>
  );
};

export default Auth;
