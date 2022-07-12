import { useRef, useState } from "react";
import client from "../config/client";
import useRefresh from "../hooks/useRefresh";
import store from "../store";
import LoadingSpinner from "./LoadingSpinner";
import FileBase from "react-file-base64";

const Upload = () => {
  const textRef = useRef();
  const tagsRef = useRef();
  const refresh = useRefresh();
  const [postImg, setPostImg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

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

  const upload = async (text, tags) => {
    setLoading(true);
    const { user } = store.getState().user;
    await client.post(
      "/posts/",
      {
        userId: user.id,
        post: {
          text,
          tags,
          file: postImg,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      }
    );
    setLoading(false);
    setSuccessMsg("Post successfully uploaded!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const text = textRef.current?.value;
    if (!text?.trim()) {
      setErrorMsg("No text entered");
      return;
    }
    let tags = tagsRef.current?.value?.split(",");
    if (tags.length > 0 && tags[0] === "") {
      tags = [];
    }

    try {
      await upload(text, tags);
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          await refresh();
          await upload(text, tags);
        } catch (error) {
          console.log(error);
        }
      }
    }

    textRef.current.value = tagsRef.current.value = "";
    setPostImg("");
  };

  return (
    <div>
      <p className="page-title">Upload</p>
      <div className="mx-4 md:mx-8">
        <div className="bg-blue-100 shadow-md container p-2 m-4 mx-auto">
          <form onSubmit={handleSubmit}>
            <textarea
              maxLength={150}
              ref={textRef}
              placeholder="What's on your mind?"
              className="resize-y min-h-[4rem] max-h-28 p-2 w-full
            outline-none shadow-inner text-gray-800"
            ></textarea>
            <label className="mt-3 mb-1 block w-full border-b-2" htmlFor="tags">
              Tags (comma separated):
            </label>
            <input
              onChange={handleTagsChange}
              className="outline-none w-full"
              id="tags"
              type="text"
              ref={tagsRef}
            />
            <label className="w-full block" htmlFor="image">
              Image:
            </label>
            <FileBase
              id="image"
              type="file"
              multiple={false}
              onDone={({ base64 }) => setPostImg(base64)}
            />
            <button
              disabled={loading}
              className="bg-purple-500 text-white p-1 w-24 mx-auto
          my-2 hover:bg-purple-700"
            >
              Share
            </button>
            {loading && (
              <div className="my-4">
                <LoadingSpinner />
              </div>
            )}
            {errorMsg && (
              <p
                className="bg-red-500 max-w-sm mt-6 p-2 text-white 
                font-medium text-center text-sm"
              >
                {errorMsg}
              </p>
            )}
            {successMsg && (
              <p
                className="bg-green-500 max-w-sm mt-6 p-2 text-white 
              font-medium text-center text-sm"
              >
                {successMsg}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Upload;
