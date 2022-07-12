import {
  UserCircleIcon,
  UserGroupIcon,
  CameraIcon,
  FilmIcon,
  HeartIcon,
} from "@heroicons/react/solid";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import "./Sidebar.css";

const SidebarIcon = ({ Icon, text, onClick }) => (
  <div className="icon-group group" onClick={onClick}>
    <Icon className="w-10 text-gray-500" />
    <p
      className="group-hover:text-purple-700 group-hover:font-semibold 
    transition-all duration-100 ease-in-out"
    >
      {text}
    </p>
  </div>
);

const Sidebar = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  return (
    user && (
      <div
        className="hidden md:flex flex-col md:w-40 lg:w-64 border-r-2 
        border-gray-300 sidebar items-center"
      >
        <SidebarIcon
          Icon={UserCircleIcon}
          text="Profile"
          onClick={() => navigate("/")}
        />
        <SidebarIcon
          Icon={HeartIcon}
          text="Liked Posts"
          onClick={() => navigate("/likedPosts")}
        />
        <SidebarIcon
          Icon={UserGroupIcon}
          text="Search"
          onClick={() => navigate("/search")}
        />
        <SidebarIcon
          Icon={CameraIcon}
          text="Post"
          onClick={() => navigate("/upload")}
        />
        <SidebarIcon
          Icon={FilmIcon}
          text="Feed"
          onClick={() => navigate("/feed")}
        />
      </div>
    )
  );
};

export default Sidebar;
