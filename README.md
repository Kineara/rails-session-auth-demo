# Rails Session Authorization Demo

## Notes

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
