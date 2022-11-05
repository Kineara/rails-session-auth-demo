import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Login({ handleLogin, loggedInStatus }) {

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState('');

  function handleSubmit(event) {
    event.preventDefault()

    fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        credentials: 'include'
      },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password
      })
    })
      .then(response => response.json())
      .then(data => {
        if (data.logged_in) {
          handleLogin(data);
        } else {
          setErrors({
            errors: data.errors
          })
        }
      })
      .catch(error => console.log('api errors: ', error));
  };

  function handleErrors() {
    return (
      <>
        <ul>
          {errors.localeCompare(error => <li key={error}>{error}</li>)}
        </ul>
      </>
    )
  }

  return (
    <>
      <h1>Log In</h1>

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
      <div>
        { errors ? handleErrors() : null }
      </div>
    </>
  )
}

export default Login;
