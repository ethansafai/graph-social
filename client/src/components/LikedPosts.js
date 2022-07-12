import { useCallback, useEffect, useState } from "react";
import client from "../config/client";
import useHTTPCall from "../hooks/useHTTPCall";
import store from "../store";
import LoadingSpinner from "./LoadingSpinner";
import Post from "./Post";

const LikedPosts = () => {
  const [postsLoading, setPostsLoading] = useState(false);
  const [posts, setPosts] = useState([]);

  const getLikedPosts = async () => {
    setPostsLoading(true);
    const { user } = store.getState().user;
    const { data } = await client.get("/posts/user/liked/posts/all", {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
      },
    });
    setPosts(data);
    setPostsLoading(false);
  };

  const likedPostsCall = useHTTPCall(useCallback(getLikedPosts, []));

  useEffect(() => {
    likedPostsCall();
  }, [likedPostsCall]);

  return (
    <>
      <p className="page-title">Liked Posts</p>
      {postsLoading ? (
        <div className="mt-4">
          <LoadingSpinner />
        </div>
      ) : (
        posts.length > 0 && (
          <div
            className="lex flex-col gap-2 items-center my-6 mx-4 
      bg-white p-2"
          >
            <div className="flex flex-col gap-2 items-center w-[90%] min-w-fit">
              {posts?.map((post) => (
                <Post setPosts={setPosts} key={post._id} post={post} />
              ))}
            </div>
          </div>
        )
      )}
    </>
  );
};

export default LikedPosts;
