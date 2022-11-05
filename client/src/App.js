import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/registrations/Login";
import Signup from "./components/registrations/Signup";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();

  function handleLogin(data) {
    // data = response from server
    console.log('handle login fired');
    setLoggedIn(true);
    setUser(data.user);
    navigate('/');
  };

  function handleLogout() {
    setLoggedIn(false);
    setUser({});
  };

  useEffect(() => {
    fetch("http://localhost:3001/logged_in", { credentials: "include" })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      if (data.logged_in) {
        handleLogin(data);
      } else {
        handleLogout();
      }
    })
    .catch((error) => console.log("api errors: ", error));
  }, []);

  return (
    <Routes>
      <Route exact path="/" element={<Home loggedInStatus={loggedIn} />} />
      <Route
        exact
        path="/login"
        element={<Login handleLogin={handleLogin} loggedInStatus={loggedIn} />}
      />
      <Route
        exact
        path="/signup"
        element={<Signup handleLogin={handleLogin} loggedInStatus={loggedIn} />}
      />
    </Routes>
  );
}

export default App;
