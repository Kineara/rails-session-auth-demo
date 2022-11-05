import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Login() {

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState('');

  function handleSubmit(event) {
    event.preventDefault()
  };

  return (
    <>
      <form onSubmit={() => handleSubmit()}>
        <input 
          placeholder="username"
          type="text"
          name="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <input 
          placeholder="email"
          type="text"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input 
          placeholder="password"
          type="password"
          name="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button placeholder="submit" type="submit">
          Log In 
        </button>

        <div>
          or <Link to='/signup'>Sign Up</Link>
        </div>
      </form>
    </>
  )
}

export default Login;
