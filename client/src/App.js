import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/registrations/Login";
import Signup from "./components/registrations/Signup";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState({});

  const handleLogin = (data) => {
    // data = response from server
    setLoggedIn(true);
    setUser(data.user);
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUser({});
  };

  const loginStatus = () => {
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
  };

  useEffect(() => {
    loginStatus();
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
