import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../config/client";
import useHTTPCall from "../hooks/useHTTPCall";
import store from "../store";
import LoadingSpinner from "./LoadingSpinner";
import Post from "./Post";

import "./User.css";

const User = () => {
  const { id } = useParams();
  const { user: currentUser } = store.getState().user;
  const navigate = useNavigate();

  const [userData, setUserData] = useState({});
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [numFollowers, setNumFollowers] = useState();
  const [userIsFollowing, setUserIsFollowing] = useState();
  const [actionLoading, setActionLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [blocked, setBlocked] = useState();
  const [blocking, setBlocking] = useState(currentUser.blocked.includes(id));

  const followUser = async () => {
    setActionLoading(true);
    const { user: updatedUser } = store.getState().user;
    await client.post(
      `/users/follow/${userData._id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${updatedUser.accessToken}`,
        },
      }
    );
    setUserIsFollowing(true);
    setNumFollowers((prev) => prev + 1);
    setActionLoading(false);
  };

  const unfollowUser = async () => {
    setActionLoading(true);
    const { user: updatedUser } = store.getState().user;
    await client.delete(`/users/follow/${userData._id}`, {
      headers: {
        Authorization: `Bearer ${updatedUser.accessToken}`,
      },
    });
    setUserIsFollowing(false);
    setNumFollowers((prev) => prev - 1);
    setActionLoading(false);
  };

  const blockUser = async () => {
    setActionLoading(true);
    const { user: updatedUser } = store.getState().user;
    await client.post(
      `/users/block/${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${updatedUser.accessToken}`,
        },
      }
    );
    setActionLoading(false);
    setBlocking(true);
  };

  const unblockUser = async () => {
    setActionLoading(true);
    const { user: updatedUser } = store.getState().user;
    await client.delete(`/users/block/${id}`, {
      headers: {
        Authorization: `Bearer ${updatedUser.accessToken}`,
      },
    });
    setActionLoading(false);
    setBlocking(false);
  };

  const followCall = useHTTPCall(useCallback(followUser, [userData._id]));
  const unfollowCall = useHTTPCall(useCallback(unfollowUser, [userData._id]));
  const blockCall = useHTTPCall(useCallback(blockUser, [id]));
  const unblockCall = useHTTPCall(useCallback(unblockUser, [id]));

  const handleBlock = async () => {
    if (actionLoading || blocked) return;

    if (blocking) {
      await unblockCall();
    } else {
      await blockCall();
    }
  };

  const handleFollow = async () => {
    if (actionLoading || blocked) return;

    if (userIsFollowing) {
      await unfollowCall();
    } else {
      await followCall();
    }
  };

  const getUserData = async () => {
    setUserDataLoading(true);
    const { user: updatedUser } = store.getState().user;
    const { data } = await client.get(`/users/${id}`, {
      headers: { Authorization: `Bearer ${updatedUser.accessToken}` },
    });
    setUserData(data);
    setNumFollowers(data.followers.length);
    setUserDataLoading(false);
    setUserIsFollowing(data.followers.includes(currentUser.id));
    setBlocked(data.blocked.includes(currentUser.id));
    if (!blocked) {
      await getUserPosts();
    } else {
      setPosts([]);
    }
  };

  const getUserPosts = useCallback(async () => {
    setPostsLoading(true);
    const { user: updatedUser } = store.getState().user;
    const { data } = await client.get(`/posts/${id}/posts`, {
      headers: { Authorization: `Bearer ${updatedUser.accessToken}` },
    });
    setPosts(data);
    setPostsLoading(false);
  }, [id]);

  const userDataCall = useHTTPCall(
    useCallback(getUserData, [blocked, getUserPosts, currentUser.id, id])
  );

  useEffect(() => {
    if (id === currentUser.id) {
      navigate("/");
      return;
    }

    userDataCall();
  }, [navigate, userDataCall, id, currentUser.id]);

  return userDataLoading ? (
    <LoadingSpinner />
  ) : (
    <div
      className="mx-4 flex flex-col gap-4 user bg-white pb-4 mb-6 
    shadow-md"
    >
      <p
        className="font-semibold text-center p-2 rounded-t-lg -mb-4 
      w-[90%] border-b border-gray-100"
      >
        @{userData.username}
      </p>
      <div className="bg-white px-2 pt-4 pb-6">
        <div className="flex info-section items-center justify-center">
          {userData.avatar && <img alt="user avatar" src={userData.avatar} />}
          <p className="user-info">
            {numFollowers}{" "}
            <span className="info">
              {numFollowers === 1 ? "follower" : "followers"}
            </span>
          </p>
          <p className="user-info">
            {userData.following?.length} <span className="info">following</span>
          </p>
          <p className="user-info">
            {userData.posts?.length}{" "}
            <span className="info">
              {userData.posts?.length === 1 ? "post" : "posts"}
            </span>
          </p>
        </div>
        {userData.bio && (
          <p
            className="bg-blue-400 min-w-[90%] text-center text-white 
          mx-auto my-4"
          >
            "{userData.bio}"
          </p>
        )}
        {blocked ? (
          <p className="text-center bg-red-500 font-medium text-white">
            You are blocked by this user
          </p>
        ) : (
          <div className="flex gap-2">
            <button
              disabled={actionLoading || blocking}
              onClick={handleFollow}
              className="text-white w-32 py-1 mx-auto font-medium 
            bg-blue-500 hover:bg-blue-700 text-sm"
            >
              {userIsFollowing ? "unfollow" : "follow"}
            </button>
            <button
              disabled={actionLoading}
              onClick={handleBlock}
              className="text-white w-32 py-1 mx-auto font-medium 
            bg-red-500 hover:bg-red-700 text-sm"
            >
              {blocking ? "unblock" : "block"}
            </button>
          </div>
        )}
      </div>
      {postsLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="w-full flex flex-col gap-2 items-center my-6 px-2">
          <div className="flex flex-col gap-2 items-center w-[90%] min-w-fit">
            {posts.map((post) => (
              <Post setPosts={setPosts} key={post._id} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default User;
