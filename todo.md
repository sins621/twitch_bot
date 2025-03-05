# To-do
## All

- [ ] Start Bot
- [ ] Authorize Token
- [ ] Attempt Refresh if Token Out
      of Date
- [ ] Start Auth Server if Refresh
      Fails
- [ ] Restart Bot When Recieve New
      Token

### Postgres

- [x] Return Environment Variables 
- [x] Add Tokens
- [ ] Update Tokens in DB on Refresh

### TwitchBot

- [ ] Handle Refresh Error
- [ ] Refresh Token
- [x] Create Socket
  - [ ] Handle Websocket Timeout
- [x] Register to Chat
- [x] Handle Messages
  - [x] Handle Command
  - [x] Split Command and Arg
  - [x] Switch on Command
  - [x] Make Spotify API Calls
- [ ] Handle Connection Loss

### TokenGenerator

- [ ] Start /api/authenticate
- [ ] Wait for /api/auth_redirect
- [ ] Signal Bot to Restart Somehow
