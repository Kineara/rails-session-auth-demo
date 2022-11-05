import React, { useState } from 'react';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
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
    </>
  )
}

export default Signup;