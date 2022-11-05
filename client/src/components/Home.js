import React from 'react';
import { Link } from 'react-router-dom';

function Home({ handleLogout, loggedInStatus }) {

  return (
    <>
      <Link to='/login'>Log In</Link>
      <br />
      <Link to='/signup'>Sign Up</Link>
      <br />
      { loggedInStatus ? <Link to='/logout' onClick={() => handleLogout()}>Log Out</Link> : null}
    </>
  );
};

export default Home;