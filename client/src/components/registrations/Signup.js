import React, { useState } from 'react';

function Signup({ handleLogin, loggedInStatus }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState('');

  function handleSubmit(event) {
    event.preventDefault();

    fetch('http://localhost:3001/users', {
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
        if (data.status === 'created') {
          handleLogin(data)
        } else {
          setErrors(data.errors)
        }
      })
      .catch(error => console.log('api errors: ', error))
  }

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
      <h1>Sign Up</h1>

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
          type="email"
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
        <input 
          placeholder="confirm password"
          type="password"
          name="passwordConfirmation"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
        />

        <button placeholder="submit" type="submit">
          Sign Up
        </button>

      </form>
      <div>
        { errors ? handleErrors() : null }
      </div>
    </>
  )
}

export default Signup;