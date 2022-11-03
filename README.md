# Rails Session Authorization Demo

- Credit to https://medium.com/how-i-get-it/react-with-rails-user-authentication-8977e98762f2 for the original tutorial

## Notes

### Rails initial setup

- Use `rails new` to set up new application, without the `--api` flag

  `rails new rails-session-auth-demo --database=postgresql`

- Add bcrypt and rack-cors to gemfile and run `bundle` to install

  ```
  #Gemfile
  gem 'bcrypt'
  gem 'rack-cors'
  ```

- Create a new file called `cors.rb` in `config/initializers` and add the following:

  ```
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

  ```
  if Rails.env === 'production'
    Rails.application.config.session_store :cookie_store, key: '_rails-session-auth-demo', domain: 'your-frontend-domain'
  else
    Rails.application.config.session_store :cookie_store, key: '_rails-session-auth-demo'
  end
  ```

  Set the key name to an underscore followed by your app name

- Update Puma to run on a different port than the front end

  ```
  #config/puma.rb
  ...
  port ENV.fetch("PORT") { 3001 }
  ...
  ```

### User Model

- Create User model and migrate database

  ```
  rails g model User username email password_digest

  rake db:create && rake db:migrate
  ```

- Update User model with has_secure_password attribute and basic validations

  ```
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



