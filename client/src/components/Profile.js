import { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setSelf } from "../store/user";
import client from "../config/client";
import store from "../store";
import LoadingSpinner from "./LoadingSpinner";
import Post from "./Post";
import FileBase from "react-file-base64";
import useHTTPCall from "../hooks/useHTTPCall";

import "./Profile.css";

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const [edit, setEdit] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [userData, setUserData] = useState(user);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const handleImageZoom = (e) => {
    e.target.classList.toggle("w-32");
    e.target.classList.toggle("w-full");
  };

  const updateUser = async () => {
    setLoading(true);
    const { user: updatedUser } = store.getState().user;
    const patch = {
      name,
      bio,
    };
    if (avatar) {
      patch.avatar = avatar;
    }
    const { data } = await client.patch("/users", patch, {
      headers: {
        Authorization: `Bearer ${updatedUser.accessToken}`,
      },
    });
    dispatch(setSelf(data));
    setSuccessMsg("Profile updated successfully");
    setLoading(false);
  };

  const removeAvatar = async () => {
    setLoading(true);
    const { user: updatedUser } = store.getState().user;
    const { data } = await client.patch(
      "/users",
      {
        avatar: "",
      },
      {
        headers: {
          Authorization: `Bearer ${updatedUser.accessToken}`,
        },
      }
    );
    dispatch(setSelf(data));
    setSuccessMsg("Profile updated successfully");
    setLoading(false);
  };

  const getPosts = async () => {
    setPostsLoading(true);
    const { user: updatedUser } = store.getState().user;
    if (!updatedUser) return;
    const { data } = await client.get(`/posts/${updatedUser.id}/posts`, {
      headers: {
        Authorization: `Bearer ${updatedUser.accessToken}`,
      },
    });
    setPosts(data);
    setPostsLoading(false);
  };

  const updateCall = useHTTPCall(
    useCallback(updateUser, [avatar, bio, dispatch, name])
  );
  const removeAvatarCall = useHTTPCall(useCallback(removeAvatar, [dispatch]));
  const postsCall = useHTTPCall(useCallback(getPosts, []));

  const handleSubmit = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) {
      setErrorMsg("Name is required");
      return;
    }

    await updateCall();
    setEdit(true);
  };

  useEffect(() => {
    postsCall();

    store.subscribe(() => {
      const { user: currentUser } = store.getState().user;
      setUserData(currentUser);
      setName(currentUser?.name);
      setBio(currentUser?.bio);
    });

    return () => {
      setEdit(false);
      const { user: currentUser } = store.getState().user;
      setUserData(currentUser);
      setName(currentUser?.name);
      setBio(currentUser?.bio);
    };
  }, [user, postsCall]);

  return (
    <div className="flex flex-col justify-center items-center profile">
      <p className="page-title">Profile</p>
      <button
        disabled={name === undefined}
        id="edit"
        onClick={() => {
          setEdit((prev) => !prev);
          setErrorMsg("");
          setSuccessMsg("");
        }}
      >
        {edit ? "Close" : "Edit Profile"}
      </button>
      {edit ? (
        <>
          <div className="flex flex-col gap-1 mt-6 w-[80%]">
            <p>
              Name:
              <input
                spellCheck={false}
                className="w-full outline-none p-2 shadow-sm"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </p>
            <p>Email: {userData.email}</p>
            <p>Username: {userData.username}</p>
            <p>
              <span>
                {userData.followers.length}{" "}
                {userData.followers.length === 1 ? "follower" : "followers"}
              </span>
              {", "}
              <span>{userData.following?.length} following</span>
              {", "}
              <span>
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </span>
            </p>
            <p>Bio:</p>
            <textarea
              className="w-full min-h-[5rem] max-h-[10rem] resize-y p-2 
              outline-none shadow-md"
              maxLength="200"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              spellCheck={false}
            />
            <div className="flex justify-start items-center mt-2">
              <p id="avatar" className="w-full">
                Avatar:
              </p>
              {userData.avatar && (
                <img
                  onMouseEnter={handleImageZoom}
                  onMouseLeave={handleImageZoom}
                  src={userData.avatar}
                  alt="user avatar"
                  className="w-32 cursor-zoom-in"
                />
              )}
            </div>
            <FileBase
              type="file"
              multiple={false}
              onDone={({ base64 }) => setAvatar(base64)}
            />
            {userData.avatar && (
              <button
                id="remove-avatar"
                onClick={async () => {
                  await removeAvatarCall();
                  setEdit(true);
                }}
              >
                Remove Avatar
              </button>
            )}
          </div>
          {errorMsg && (
            <p
              className="bg-red-500 max-w-sm mt-6 p-2 text-white font-medium 
            text-center"
            >
              {errorMsg}
            </p>
          )}
          {successMsg && (
            <p
              className="bg-blue-500 max-w-sm mt-6 p-2 text-white 
              font-medium text-center"
            >
              {successMsg}
            </p>
          )}
          {loading && <LoadingSpinner />}
          <button className="mb-6" onClick={handleSubmit}>
            Save
          </button>
        </>
      ) : (
        userData &&
        (postsLoading ? (
          <div className="mt-4">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div
              className="flex flex-col gap-2 items-center my-6 px-3 bg-white 
            p-1 mx-2"
            >
              <div className="flex flex-col gap-2 items-center min-w-fit">
                {posts?.map((post) => (
                  <Post setPosts={setPosts} key={post._id} post={post} />
                ))}
              </div>
            </div>
          </>
        ))
      )}
    </div>
  );
};

export default Profile;
