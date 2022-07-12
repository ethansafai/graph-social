import { useCallback, useEffect, useState } from "react";
import client from "../config/client";
import useHTTPCall from "../hooks/useHTTPCall";
import store from "../store";
import LoadingSpinner from "./LoadingSpinner";
import Post from "./Post";

const Feed = () => {
  const getPosts = async () => {
    setPostsLoading(true);
    const { user } = store.getState().user;
    const { data } = await client.get("/posts/user/following/list/posts", {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
      },
    });
    setPosts(data);
    setPostsLoading(false);
  };

  const callHTTP = useHTTPCall(useCallback(getPosts, []));
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    callHTTP();
  }, [callHTTP]);

  return (
    <div>
      <p className="page-title mb-6">Feed</p>
      {postsLoading ? (
        <LoadingSpinner text="Fetching your feed..." />
      ) : (
        posts.length > 0 &&
        <>
          <div
            className="flex flex-col gap-4 mx-4 mb-6 bg-white p-4 rounded-lg 
          shadow-md"
          >
            {posts.map((post) => (
              <Post key={post._id} setPosts={setPosts} post={post} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Feed;
