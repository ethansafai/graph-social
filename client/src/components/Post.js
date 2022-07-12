import { useCallback, useRef, useState } from "react";
import { HeartIcon, TrashIcon } from "@heroicons/react/solid";
import client from "../config/client";
import useHTTPCall from "../hooks/useHTTPCall";
import store from "../store";
import Comment from "./Comment";
import LoadingSpinner from "./LoadingSpinner";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import moment from "moment";

import "./Post.css";

const Post = ({ post, setPosts }) => {
  const navigate = useNavigate();
  const { text, tags, likes, comments, createdAt, user } = post;
  const [commentData, setCommentData] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [error, setError] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [numComments, setNumComments] = useState(comments.length);
  const [actionLoading, setActionLoading] = useState(false);
  const inputRef = useRef(null);
  const { user: currentUser } = useSelector((state) => state.user);
  const [liked, setLiked] = useState(post.likes.includes(currentUser.id));
  const [numLikes, setNumLikes] = useState(likes.length);
  const wrapperRef = useRef(null);

  const likePost = async () => {
    setActionLoading(true);
    const { user: loggedInUser } = store.getState().user;
    await client.post(
      `/posts/like/${post._id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${loggedInUser.accessToken}`,
        },
      }
    );
    setActionLoading(false);
    setLiked(true);
    setNumLikes((prev) => prev + 1);
  };

  const unlikePost = async () => {
    setActionLoading(true);
    const { user: loggedInUser } = store.getState().user;
    await client.delete(`/posts/like/${post._id}`, {
      headers: {
        Authorization: `Bearer ${loggedInUser.accessToken}`,
      },
    });
    setActionLoading(false);
    setLiked(false);
    setNumLikes((prev) => prev - 1);
  };

  const deletePost = async () => {
    setActionLoading(true);
    const { user: loggedInUser } = store.getState().user;
    await client.delete(`/posts/${post._id}`, {
      headers: {
        Authorization: `Bearer ${loggedInUser.accessToken}`,
      },
    });
    setActionLoading(false);
    wrapperRef.current.classList.add("hide");
    setTimeout(
      () =>
        setPosts((prev) =>
          prev.filter((statePost) => statePost._id !== post._id)
        ),
      300
    );
  };

  const likeCall = useHTTPCall(useCallback(likePost, [post._id]));
  const unlikeCall = useHTTPCall(useCallback(unlikePost, [post._id]));
  const deleteCall = useHTTPCall(useCallback(deletePost, [post._id, setPosts]));

  const handleLike = async () => {
    if (actionLoading) return;
    if (!liked) {
      await likeCall();
    } else {
      await unlikeCall();
    }
  };

  const handleDelete = async () => {
    if (actionLoading) return;
    await deleteCall();
  };

  const getComments = async () => {
    setCommentsLoading(true);
    const { user: loggedInUser } = store.getState().user;

    const { data } = await client.get(`/posts/${post._id}/comments`, {
      headers: {
        Authorization: `Bearer ${loggedInUser.accessToken}`,
      },
    });

    setCommentData(data);
    setCommentsLoading(false);
  };

  const commentsCall = useHTTPCall(useCallback(getComments, [post._id]));

  const handleShowComments = async () => {
    if (commentsLoading) return;
    if (commentData.length > 0) {
      setCommentData([]);
      setError("");
      return;
    }

    await commentsCall();
  };

  const uploadComment = useCallback(async () => {
    setCommentSending(true);
    const { user: loggedInUser } = store.getState().user;

    const { data } = await client.post(
      `/posts/${post._id}/comment`,
      {
        comment: inputRef.current.value,
      },
      {
        headers: {
          Authorization: `Bearer ${loggedInUser.accessToken}`,
        },
      }
    );

    data.user = {
      _id: data.user,
      username: loggedInUser.username,
    };

    setCommentData((prev) => [...prev, data]);
    setCommentSending(false);
  }, [post._id]);

  const uploadCall = useHTTPCall(
    useCallback(async () => {
      await uploadComment();
      setNumComments((prev) => prev + 1);
      inputRef.current.value = "";
    }, [uploadComment])
  );

  const handleUploadComment = async () => {
    setError("");

    if (inputRef.current.value.length === 0) {
      setError("Comment cannot be empty");
      return;
    }

    await uploadCall();
  };

  return (
    <div ref={wrapperRef} className="rounded-lg shadow-sm w-full wrapper">
      <div
        className="flex flex-col justify-center min-w-full 
      bg-purple-50 border-purple-200 py-4 pl-8 post border-l-8"
      >
        <p className="title">{text}</p>
        <p className="user text-sm font-normal">
          -{" "}
          <Link
            className="text-blue-700 hover:text-blue-900 hover:font-medium"
            to={`/profile/${user._id}`}
          >
            @{user.username}
          </Link>
        </p>
        {post.file && (
          <div className="w-full flex justify-start">
            <img
              src={post.file}
              alt="post"
              className="post md:w-auto mb-2 max-h-96 object-contain"
            />
          </div>
        )}
        <p>
          {tags?.map((tag, index) => (
            <span
              className="text-blue-500 hover:text-blue-700 cursor-pointer"
              onClick={() => navigate(`/search/${tag}`)}
              key={index}
            >
              #{tag}{" "}
            </span>
          ))}
        </p>
        <p>
          <span>
            {numLikes} {numLikes === 1 ? "like" : "likes"}
          </span>
          {", "}
          <span>
            {numComments} {numComments === 1 ? "comment" : "comments"}
          </span>
        </p>
        <p>{moment(new Date(createdAt)).fromNow()}</p>
        <div className="flex gap-2 mt-2 ml-[1px]">
          <HeartIcon
            onClick={handleLike}
            className="w-6 cursor-pointer text-pink-500 
          hover:text-pink-700 transition-colors duration-100 ease-in-out"
          />
          {post.user._id === currentUser.id && (
            <TrashIcon
              onClick={handleDelete}
              className="w-6 cursor-pointer text-red-500 
            hover:text-red-700 transition-colors duration-100 ease-in-out"
            />
          )}
        </div>
        {numComments > 0 && (
          <button
            onClick={handleShowComments}
            className="show-comments mt-3"
            disabled={commentsLoading}
          >
            {commentData.length > 0 ? "Hide comments" : "Show comments"}
          </button>
        )}
        {commentsLoading && (
          <div className="flex m-4 mt-6">
            <LoadingSpinner />
          </div>
        )}
        {!commentsLoading && commentData.length > 0 && (
          <div className="p-2">
            {commentData.map((comment) => (
              <Comment
                setNumComments={setNumComments}
                comment={comment}
                key={comment._id}
              />
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          className="mt-3 p-2 text-sm outline-none w-[98%]"
          placeholder="Add a comment..."
          spellCheck={false}
        />
        {error && (
          <p
            className="text-sm bg-red-500 p-2 mt-4 text-white 
          font-bold text-center"
          >
            {error}
          </p>
        )}
        {commentSending && (
          <div className="mt-4">
            <LoadingSpinner />
          </div>
        )}
        <button
          disabled={commentSending}
          onClick={handleUploadComment}
          className="upload-comment"
        >
          Post
        </button>
      </div>
    </div>
  );
};

export default Post;
