import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../config/client";
import useRefresh from "../hooks/useRefresh";
import store from "../store";
import LoadingSpinner from "./LoadingSpinner";
import Post from "./Post";

const Search = () => {
  const { tag } = useParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [postResults, setPostResults] = useState([]);
  const inputRef = useRef(null);
  const tagsRef = useRef(null);
  const refresh = useRefresh();
  const navigate = useNavigate();

  const handleTagsChange = () => {
    const value = tagsRef.current?.value;
    const length = value?.length;
    const last = value[length - 1];
    if (length === 0) return;
    if (length === 1) {
      if (last === " " || last === ",") return;
    } else {
      if ((last === " " || last === ",") && last !== value[length - 2]) {
        return;
      }
    }
    const tags = tagsRef.current?.value?.replace(" ", ",");
    const arr = tags.split(",").filter((tag) => tag);

    if (arr.length > 0) {
      let str = arr[0];
      for (let i = 1; i < arr.length; i++) {
        if (arr[i]) {
          str += "," + arr[i];
        }
      }
      tagsRef.current.value = str;
    }
  };

  const sanitizeString = (str) => {
    return "@" + str.replace("@", "");
  };

  const handleInputChange = () => {
    const { value } = inputRef.current;
    inputRef.current.value = sanitizeString(value);
  };

  const sendSearch = async (username) => {
    setLoading(true);
    const { user: loggedInUser } = store.getState().user;
    const { data } = await client.get(`/users/find/${username.substring(1)}`, {
      headers: {
        Authorization: `Bearer ${loggedInUser.accessToken}`,
      },
    });
    setResults(data);
    setLoading(false);
  };

  const handleSearch = async () => {
    setError("");
    setResults([]);
    setPostResults([]);
    const { value } = inputRef.current;
    if (value.length <= 1) {
      setError("Please enter a username");
      return;
    }

    try {
      await sendSearch(value);
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await refresh();
          await sendSearch(value);
        } catch (error) {
          console.log(error);
        }
      } else if (error.response?.status === 404) {
        setError("No users found");
        setLoading(false);
      }
    }
  };

  const sendTagSearch = async (tags) => {
    setLoading(true);
    const { user: loggedInUser } = store.getState().user;
    const { data } = await client.get(`/posts/tags/${tags}`, {
      headers: {
        Authorization: `Bearer ${loggedInUser.accessToken}`,
      },
    });
    setPostResults(data);
    if (!data.length) {
      setError("No posts found");
    }
    setLoading(false);
  };

  const handleTagSearch = async () => {
    setError("");
    setResults([]);
    setPostResults([]);

    const tags = tagsRef.current.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    if (tags.length > 0) {
      let str = tags[0];
      for (let i = 1; i < tags.length; i++) {
        if (tags[i]) {
          str += "," + tags[i];
        }
      }
      tagsRef.current.value = str;
      try {
        await sendTagSearch(str);
      } catch (error) {
        if (error.response?.status === 401) {
          try {
            await refresh();
            await sendTagSearch(str);
          } catch (error) {
            console.log(error);
          }
        } else if (error.response?.status === 404) {
          setError("No users found");
          setLoading(false);
        }
      }
    } else {
      setError("No tags detected");
    }
  };

  useEffect(() => {
    if (!tag) return;
    tagsRef.current.value = tag;

    // If a tag was passed as a url parameter, search for that tag as it was
    // clicked on somewhere else so the user could see corresponding posts
    const fetchPosts = async () => {
      try {
        await sendTagSearch(tag);
      } catch (error) {
        if (error.response?.status === 401) {
          try {
            await refresh();
            await sendTagSearch(tag);
          } catch (error) {
            console.log(error);
          }
        } else if (error.response?.status === 404) {
          setError("No users found");
          setLoading(false);
        }
      }
    };
    fetchPosts();
  }, [refresh, tag]);

  return (
    <div>
      <h1 className="page-title">Search</h1>
      <div className="flex flex-col justify-center items-center mt-4 gap-4">
        <input
          className="p-2 outline-none"
          placeholder="Search for a user..."
          spellCheck={false}
          onChange={handleInputChange}
          ref={inputRef}
        />
        <button
          disabled={loading}
          onClick={handleSearch}
          className="bg-blue-500 hover:bg-blue-700 text-white
          font-medium w-36 py-1 text-lg mb-4"
        >
          Search
        </button>
        {loading && <LoadingSpinner />}
        {error && (
          <p className="bg-red-500 text-white text-center w-64">{error}</p>
        )}
        <input
          onChange={handleTagsChange}
          className="p-2 outline-none mt-4"
          placeholder="Search for posts by tag..."
          id="tags"
          type="text"
          ref={tagsRef}
        />
        <button
          disabled={loading}
          onClick={handleTagSearch}
          className="bg-blue-500 hover:bg-blue-700 text-white
        font-medium w-36 py-1 text-lg"
        >
          Search
        </button>
        <div className="mt-2 flex flex-col gap-4 w-full">
          {results?.map((user, index) => (
            <div
              key={index}
              className="bg-white p-2 text-purple-700 shadow-inner border
              md:w-[30%] mx-auto"
            >
              <p
                className="cursor-pointer hover:text-purple-900 
              hover:text-[1.05rem] transition-all ease-in-out duration-50 
              hover:bg-gray-50"
                onClick={() => navigate(`/profile/${user._id}`)}
              >
                @{user.username}
              </p>
            </div>
          ))}
          {postResults.length > 0 && (
            <div
              className="flex flex-col gap-4 mb-6 bg-white p-4 rounded-lg 
          shadow-md w-[90%] mx-auto"
            >
              {postResults.map((post) => (
                <Post key={post._id} setPosts={setPostResults} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
