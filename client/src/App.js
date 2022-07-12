import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from "./components/Auth";
import Feed from "./components/Feed";
import Header from "./components/Header";
import LikedPosts from "./components/LikedPosts";
import PrivateRoute from "./components/PrivateRoute";
import Profile from "./components/Profile";
import Search from "./components/Search";
import Sidebar from "./components/Sidebar";
import Upload from "./components/Upload";
import User from "./components/User";

const App = () => (
  <BrowserRouter>
    <Header />
    <div className="mt-24 mx-auto max-w-6xl flex items-start">
      <Sidebar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<PrivateRoute />}>
            <Route path="/" element={<Profile />} />
          </Route>
          <Route path="/likedPosts" element={<PrivateRoute />}>
            <Route path="/likedPosts" element={<LikedPosts />} />
          </Route>
          <Route path="/search" element={<PrivateRoute />}>
            <Route path="/search" element={<Search />} />
          </Route>
          <Route path="/search/:tag" element={<PrivateRoute />}>
            <Route path="/search/:tag" element={<Search />} />
          </Route>
          <Route path="/upload" element={<PrivateRoute />}>
            <Route path="/upload" element={<Upload />} />
          </Route>
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile/:id" element={<PrivateRoute />}>
            <Route path="/profile/:id" element={<User />} />
          </Route>
          <Route path="/feed" element={<PrivateRoute />}>
            <Route path="/feed" element={<Feed />} />
          </Route>
          <Route path="*" element={<div>404</div>} />
        </Routes>
      </div>
    </div>
  </BrowserRouter>
);

export default App;
