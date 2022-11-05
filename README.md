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
  yarn add axios && yarn add react-router && yarn add react-router-dom
```

## App Logic

- Update App.js to serve as the router and to store the user's logged in state

```jsx
// client/src/App.js

import React, { Component } from 'react';
import axios from 'axios'
import {BrowserRouter, Switch, Route} from 'react-router-dom'
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoggedIn: false,
      user: {}
     };
  }
  render() {
    return (
      <div>
         <BrowserRouter>
          <Switch>
            <Route exact path='/' component={}/>
            <Route exact path='/login' component={}/>
            <Route exact path='/signup' component={}/>
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}
export default App;
```

- Add handleLogin and handleLogout methods

```jsx
// client/src/App.js

handleLogin = (data) => {
  this.setState({
    isLoggedIn: true,
    user: data.user,
  });
};
handleLogout = () => {
  this.setState({
    isLoggedIn: false,
    user: {},
  });
};
```

- Add a loginStatus method to get the user's login status, passing the {withCredentials: true} argument to allow Rails to set and read the cookie on the front end's browser

```jsx
// client/src/App.js

loginStatus = () => {
  axios
    .get("http://localhost:3001/logged_in", { withCredentials: true })
    .then((response) => {
      if (response.data.logged_in) {
        this.handleLogin(response);
      } else {
        this.handleLogout();
      }
    })
    .catch((error) => console.log("api errors:", error));
};
```

- Add a method to request the login status every time the component is first mounted

```jsx
// client/src/App.js
componentDidMount() {
    this.loginStatus()
  }
```

- Create the Home component

```jsx
// client/src/components/Home.js

import React from 'react';
import {Link} from 'react-router-dom'
const Home = () => {
  return (
    <div>
      <Link to='/login'>Log In</Link>
      <br></br>
      <Link to='/signup'>Sign Up</Link>
    </div>
  );
};
export default Home;
```

- Create the Login and Signup components

```jsx
// client/src/components/registrations/Login.js

import React, { Component } from 'react';
import axios from 'axios'
import {Link} from 'react-router-dom'
class Login extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      username: '',
      email: '',
      password: '',
      errors: ''
     };
  }
handleChange = (event) => {
    const {name, value} = event.target
    this.setState({
      [name]: value
    })
  };
handleSubmit = (event) => {
    event.preventDefault()
  };
render() {
    const {username, email, password} = this.state
return (
      <div>
        <h1>Log In</h1>
        <form onSubmit={this.handleSubmit}>
          <input
            placeholder="username"
            type="text"
            name="username"
            value={username}
            onChange={this.handleChange}
          />
          <input
            placeholder="email"
            type="text"
            name="email"
            value={email}
            onChange={this.handleChange}
          />
          <input
            placeholder="password"
            type="password"
            name="password"
            value={password}
            onChange={this.handleChange}
          />
         <button placeholder="submit" type="submit">
            Log In
          </button>
          <div>
            or <Link to='/signup'>sign up</Link>
          </div>
          
         </form>
      </div>
    );
  }
}
export default Login;
```

```jsx
// client/src/components/registrations/Signup.js

import React, { Component } from 'react';
import axios from 'axios'
class Signup extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      username: '',
      email: '',
      password: '',
      password_confirmation: '',
      errors: ''
     };
  }
handleChange = (event) => {
    const {name, value} = event.target
    this.setState({
      [name]: value
    })
  };
handleSubmit = (event) => {
    event.preventDefault()
  };
render() {
    const {username, email, password, password_confirmation} = this.state
return (
      <div>
        <h1>Sign Up</h1>
        <form onSubmit={this.handleSubmit}>
          <input
            placeholder="username"
            type="text"
            name="username"
            value={username}
            onChange={this.handleChange}
          />
          <input
            placeholder="email"
            type="text"
            name="email"
            value={email}
            onChange={this.handleChange}
          />
          <input 
            placeholder="password"
            type="password"
            name="password"
            value={password}
            onChange={this.handleChange}
          />
          <input
            placeholder="password confirmation"
            type="password"
            name="password_confirmation"
            value={password_confirmation}
            onChange={this.handleChange}
          />
        
          <button placeholder="submit" type="submit">
            Sign Up
          </button>
      
        </form>
      </div>
    );
  }
}
export default Signup;
```

- Update the App component to pass the user's logged in status to components

```jsx
// client/src/App.js

...

import Home from './components/Home'
import Login from './components/registrations/Login'
import Signup from './components/registrations/Signup'

...

render() {
    return (
      <div>
        <BrowserRouter>
          <Switch>
            <Route 
              exact path='/' 
              render={props => (
              <Home {...props} loggedInStatus={this.state.isLoggedIn}/>
              )}
            />
            <Route 
              exact path='/login' 
              render={props => (
              <Login {...props} handleLogin={this.handleLogin} loggedInStatus={this.state.isLoggedIn}/>
              )}
            />
            <Route 
              exact path='/signup' 
              render={props => (
              <Signup {...props} handleLogin={this.handleLogin} loggedInStatus={this.state.isLoggedIn}/>
              )}
            />
          </Switch>
        </BrowserRouter>
      </div>
    );
  }
}
```

- Update the Login and Signup methods to use the data passed from the App component

```jsx
//client/src/components/registrations/Login.js

import React, { Component } from 'react';
import axios from 'axios'
import {Link} from 'react-router-dom'
class Login extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      username: '',
      email: '',
      password: '',
      errors: ''
     };
  }
handleChange = (event) => {
    const {name, value} = event.target
    this.setState({
      [name]: value
    })
  };
handleSubmit = (event) => {
    event.preventDefault()
    const {username, email, password} = this.state
let user = {
      username: username,
      email: email,
      password: password
    }
    
axios.post('http://localhost:3001/login', {user}, {withCredentials: true})
    .then(response => {
      if (response.data.logged_in) {
        this.props.handleLogin(response.data)
        this.redirect()
      } else {
        this.setState({
          errors: response.data.errors
        })
      }
    })
    .catch(error => console.log('api errors:', error))
  };
redirect = () => {
    this.props.history.push('/')
  }
handleErrors = () => {
    return (
      <div>
        <ul>
        {this.state.errors.map(error => {
        return <li key={error}>{error}</li>
          })}
        </ul>
      </div>
    )
  }
render() {
    const {username, email, password} = this.state
return (
      <div>
        <h1>Log In</h1>
        <form onSubmit={this.handleSubmit}>
          <input
            placeholder="username"
            type="text"
            name="username"
            value={username}
            onChange={this.handleChange}
          />
          <input
            placeholder="email"
            type="text"
            name="email"
            value={email}
            onChange={this.handleChange}
          />
          <input
            placeholder="password"
            type="password"
            name="password"
            value={password}
            onChange={this.handleChange}
          />
          <button placeholder="submit" type="submit">
            Log In
          </button>
          <div>
           or <Link to='/signup'>sign up</Link>
          </div>
          
        </form>
        <div>
          {
            this.state.errors ? this.handleErrors() : null
          }
        </div>
      </div>
    );
  }
}
export default Login;
```

```jsx
//client/src/components/registrations/Signup.js

import React, { Component } from 'react';
import axios from 'axios'
class Signup extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      username: '',
      email: '',
      password: '',
      password_confirmation: '',
      errors: ''
     };
  }
handleChange = (event) => {
    const {name, value} = event.target
    this.setState({
      [name]: value
    })
  };
handleSubmit = (event) => {
    event.preventDefault()
    const {username, email, password, password_confirmation} = this.state
    let user = {
      username: username,
      email: email,
      password: password,
      password_confirmation: password_confirmation
    }
axios.post('http://localhost:3001/users', {user}, {withCredentials: true})
    .then(response => {
      if (response.data.status === 'created') {
        this.props.handleLogin(response.data)
        this.redirect()
      } else {
        this.setState({
          errors: response.data.errors
        })
      }
    })
    .catch(error => console.log('api errors:', error))
  };
redirect = () => {
    this.props.history.push('/')
  }
handleErrors = () => {
    return (
      <div>
        <ul>{this.state.errors.map((error) => {
          return key={error}>{error}</li>
        })}
        </ul> 
      </div>
    )
  }
render() {
    const {username, email, password, password_confirmation} = this.state
return (
      <div>
        <h1>Sign Up</h1>
       <form onSubmit={this.handleSubmit}>
          <input
            placeholder="username"
            type="text"
            name="username"
            value={username}
            onChange={this.handleChange}
          />
          <input
            placeholder="email"
            type="text"
            name="email"
            value={email}
            onChange={this.handleChange}
          />
          <input 
            placeholder="password"
            type="password"
            name="password"
            value={password}
            onChange={this.handleChange}
          />
          <input
            placeholder="password confirmation"
            type="password"
            name="password_confirmation"
            value={password_confirmation}
            onChange={this.handleChange}
          />
        
          <button placeholder="submit" type="submit">
            Sign Up
          </button>
      
        </form>
        <div>
          {
            this.state.errors ? this.handleErrors() : null
          }
        </div>
      </div>
    );
  }
}
export default Signup;
```