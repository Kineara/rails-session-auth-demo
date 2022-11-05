# Rails Session Authorization Demo

- Credit to https://medium.com/how-i-get-it/react-with-rails-user-authentication-8977e98762f2 for the original tutorial

## Notes

### Rails initial setup

- Use `rails new` to set up new application, without the `--api` flag

  `rails new rails-session-auth-demo --database=postgresql`

- Add bcrypt and rack-cors to gemfile and run `bundle` to install

  ```ruby
  # Gemfile

  gem 'bcrypt'
  gem 'rack-cors'
  ```

- Create a new file called `cors.rb` in `config/initializers` and add the following:

  ```ruby
  # config/initializers/cors.rb

  Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'http://localhost:3000'

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
    end
  end
  ```

- Create a new file called `session_store.rb` in `config/initializers` and add the following:

  ```ruby
  # config/initializers/session_store.rb

  if Rails.env === 'production'
    Rails.application.config.session_store :cookie_store, key: '_rails-session-auth-demo', domain: 'your-frontend-domain'
  else
    Rails.application.config.session_store :cookie_store, key: '_rails-session-auth-demo'
  end
  ```

  Set the key name to an underscore followed by your app name

- Update Puma to run on a different port than the front end

  ```ruby
  #config/puma.rb

  ...
  port ENV.fetch("PORT") { 3001 }
  ...
  ```

- Create User model and migrate database

  ```bash
  rails g model User username email password_digest

  rake db:create && rake db:migrate
  ```

- Update User model with has_secure_password attribute and basic validations

  ```ruby
  # app/models/user.rb

  class User < ApplicationRecord
  has_secure_password
  validates :username, presence: true
  validates :username, uniqueness: true
  validates :username, length: { minimum: 4 }
  validates :email, presence: true
  validates :email, uniqueness: true
  validates_format_of :email, :with => /\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})\z/i
  end
  ```

- Add routes

  ```ruby
  # config/routes.rb

  Rails.application.routes.draw do
    resources :users, only: [:create, :show, :index]
  end
  ```

- Create `users_controller.rb` and add basic methods

  ```ruby
  # app/controllers/users_controller.rb

  class UsersController < ApplicationController
  def index
      @users = User.all
      if @users
        render json: {
          users: @users
        }
      else
        render json: {
          status: 500,
          errors: ['no users found']
        }
      end
  end
  def show
      @user = User.find(params[:id])
    if @user
        render json: {
          user: @user
        }
      else
        render json: {
          status: 500,
          errors: ['user not found']
        }
      end
    end

    def create
      @user = User.new(user_params)
      if @user.save
        login!
        render json: {
          status: :created,
          user: @user
        }
      else
        render json: {
          status: 500,
          errors: @user.errors.full_messages
        }
      end
    end
  private

    def user_params
      params.require(:user).permit(:username, :email, :password, :password_confirmation)
    end
  end
  ```

- Update `application_controller.rb` with helper methods

  ```ruby
  # app/controllers/application_controller.rb

  class ApplicationController < ActionController::Base
  skip_before_action :verify_authenticity_token
  helper_method :login!, :logged_in?, :current_user, :authorized_user?, :logout!
  def login!
      session[:user_id] = @user.id
    end
  def logged_in?
      !!session[:user_id]
    end
  def current_user
      @current_user ||= User.find(session[:user_id]) if session[:user_id]
    end
  def authorized_user?
      @user == current_user
    end
  def logout!
      session.clear
    end
  end
  ```

  - Create Sessions Controller and update routes

  ```ruby
  # app/controllers/sessions_controller.rb

  class SessionsController < ApplicationController
  def create
    @user = User.find_by(email: session_params[:email])

    if @user && @user.authenticate(session_params[:password])
      login!
      render json: {
        logged_in: true,
        user: @user
      }
    else
      render json: {
        status: 401,
        errors: ['no such user', 'verify credentials and try again or signup']
      }
    end
  end
    def is_logged_in?
      if logged_in? && current_user
        render json: {
          logged_in: true,
          user: current_user
        }
      else
        render json: {
          logged_in: false,
          message: 'no such user'
        }
      end
    end
    def destroy
      logout!
      render json: {
        status: 200,
        logged_out: true
      }
    end
    private
    def session_params
      params.require(:user).permit(:username, :email, :password)
    end
  end
  ```

  ```ruby
  # app/config/routes.rb

  Rails.application.routes.draw do
    post '/login', to: 'sessions#create'
    delete '/logout', to: 'sessions#destroy'
    get '/logged_in', to: 'sessions#is_logged_in?'

    resources :users, only: [:create, :show, :index]
  end
  ```

## React Setup

- From the root directory, create the application template

  ```bash
  npx-create-react-app client && cd client
  ```

- Clean up the template:

```js
// src/App.js

import React from "react";
function App() {
  return <div></div>;
}
export default App;
```

```js
// src/index.js

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
ReactDOM.render(<App />, document.getElementById("root"));
```

- Add dependencies:

```bash
  yarn add axios && yarn add react-router@5.3.4 && yarn add react-router-dom@5.3.4
```

## App Logic

- Update index.js to make BrowserRouter available throughout the app

```jsx
// client/src/index.js

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById("root")
);
```

- Update the App component to define the routes, and add state to track whether a user is logged in and the current user

```jsx
// client/src/App.js
import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState({});

  return (
    <Routes>
      <Route exact path="/" element={null} />
      <Route exact path="/login" element={null} />
      <Route exact path="/signup" element={null} />
    </Routes>
  );
}

export default App;
```

- Update the App component with methods to update state when a user logs in or out

```jsx
// client/src/App.js

  ...

  const handleLogin = (data) => {
    // data = response from server
    setLoggedIn(true);
    setUser(data.user);
  }

  const handleLogout = () => {
    setLoggedIn(false);
    setUser({});
  }

  ...
```

- Update the app component to fetch the logged in status from the api every time the component loads

```jsx
// client/src/App.js

  ...

  const loginStatus = () => {
    fetch("http://localhost:3001/logged_in", { credentials: "include" })
      .then(response => response.json())
      .then((data) => {
        console.log(data)
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

  ...
```

- Create the Home, Signup, and Login components

```jsx
// client/src/components/Home.js

import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      <Link to="/login">Log In</Link>
      <Link to="/signup">Sign Up</Link>
    </>
  );
}

export default Home;
```

```jsx
// client/src/components/registrations/Login.js

import React, { useState } from "react";
import { Link } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
  }

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
          or <Link to="/signup">Sign Up</Link>
        </div>
      </form>
    </>
  );
}

export default Login;
```

```jsx
// client/src/components/registrations/Signup.js

import React, { useState } from "react";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState("");

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
  );
}

export default Signup;
```

- Update the App component to pass state to the Home, Login, and Signup components, and update the routes

Import the components:

```jsx
// client/src/App.js

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
```

- Update the Login and Signup components to use the data passed from the App component

```jsx
// client/src/components/registrations/Login.js

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
```

```jsx
// client/src/components/registrations/Signup.js

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
```
