import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <>
      <Link to='/login'>Log In</Link>
      <Link to='/signup'>Sign Up</Link>
    </>
  );
};

export default Home;