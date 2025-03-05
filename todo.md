# To-do
## All

- [x] Start Bot
- [x] Authorize Token
- [x] Attempt Refresh if Token Out
      of Date
- [x] Start Auth Server if Refresh
      Fails
- [x] Restart Bot When Recieve New
      Token

### Postgres

- [x] Return Environment Variables 
- [x] Add Tokens
- [x] Update Tokens in DB on Refresh

### TwitchBot

- [ ] Handle Refresh Error
- [x] Refresh Token
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

- [x] Start /api/authenticate
- [x] Wait for /api/auth_redirect
- [x] Signal Bot to Restart Somehow
