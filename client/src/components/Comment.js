import { useCallback, useState } from "react";
import { HeartIcon, TrashIcon } from "@heroicons/react/solid";
import store from "../store";
import client from "../config/client";
import { useSelector } from "react-redux";
import moment from "moment";

import "./Comment.css";
import useHTTPCall from "../hooks/useHTTPCall";
import { Link } from "react-router-dom";

const Comment = ({ setNumComments, comment }) => {
  const { text, likes, createdAt, user } = comment;
  const [numLikes, setNumLikes] = useState(likes.length);
  const [likeLoading, setLikeLoading] = useState(false);
  const { user: currentUser } = useSelector((state) => state.user);
  const [liked, setLiked] = useState(likes.includes(currentUser.id));
  const [deleted, setDeleted] = useState(false);

  const likeComment = async () => {
    setLikeLoading(true);
    const { user: loggedInUser } = store.getState().user;

    await client.post(
      `/posts/comments/${comment._id}/like`,
      {},
      {
        headers: {
          Authorization: `Bearer ${loggedInUser.accessToken}`,
        },
      }
    );

    setNumLikes((prev) => prev + 1);
    setLiked(true);
    setLikeLoading(false);
  };

  const unlikeComment = async () => {
    setLikeLoading(true);
    const { user: loggedInUser } = store.getState().user;

    await client.delete(`/posts/comments/${comment._id}/like`, {
      headers: {
        Authorization: `Bearer ${loggedInUser.accessToken}`,
      },
    });

    setNumLikes((prev) => prev - 1);
    setLiked(false);
    setLikeLoading(false);
  };

  const likeCall = useHTTPCall(useCallback(likeComment, [comment._id]));
  const unlikeCall = useHTTPCall(useCallback(unlikeComment, [comment._id]));

  const handleLike = async () => {
    if (likeLoading) return;
    if (liked) {
      await unlikeCall();
    } else {
      await likeCall();
    }
  };

  const deleteComment = async () => {
    const { user: loggedInUser } = store.getState().user;

    await client.delete(`/posts/comments/${comment._id}`, {
      headers: {
        Authorization: `Bearer ${loggedInUser.accessToken}`,
      },
    });

    setNumComments((prev) => prev - 1);
    setDeleted(true);
  };

  const deleteCall = useHTTPCall(
    useCallback(deleteComment, [comment._id, setNumComments])
  );

  const handleDelete = async () => {
    if (deleted) return;
    await deleteCall();
  };

  return (
    !deleted && (
      <div
        className="mt-4 bg-blue-50 border-l-4 border-l-blue-400 p-2 
      text-gray-700 shadow-sm"
      >
        <div className="comment">
          <p className="title">"{text}"</p>
          <p>
            {numLikes} {numLikes === 1 ? "like" : "likes"}{" "}
          </p>
          <div className="flex gap-2 m-1">
            <HeartIcon
              onClick={handleLike}
              className="w-5 mb-2 cursor-pointer text-pink-500 
        hover:text-pink-700 transition-colors duration-150 ease-in-out"
            />
            {user._id === currentUser.id && (
              <TrashIcon
                onClick={handleDelete}
                className="w-5 mb-2 cursor-pointer text-red-500
        hover:text-red-700 transition-colors duration-150 ease-in-out"
              />
            )}
          </div>
          <p>{moment(new Date(createdAt)).fromNow()}</p>
          <p className="font-light cursor-pointer hover:text-purple-800">
            <Link to={`/profile/${user._id}`}>@{user.username}</Link>
          </p>
        </div>
      </div>
    )
  );
};

export default Comment;
