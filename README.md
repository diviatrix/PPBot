# PPBot
*Author:* t.me/zerodivider

# Telegram bot for all the Dudes

*Prequisites:*
- Node.js
- created Telegram bot via @BotFather
- bot secret from @BotFather

*Compatibility:*
- Checked only on Windows 11, maybe you need to fix paths to use on other os

*Installation:*
- checkout folder to any place
- run PowerShell from checkout folder (RMB -> Open in Terminal)
- run `node app.js`
- follow instruction on screen
- add bot to chat as admin (it is required to get access to messages)
- or text to your bot @your_bot_name directly

*Usage*
- `/go` - registers user with defaultUser data and Telegram ID
- `/pp` - Gives user random PP of the Day or show recieved if timeout is not reached
- `/pp 1337` - use with any number to check its stats, or if it is added
- `/me` - shows user data stats 
All bot answers are replies to request message

*User Data:*
- saved as JSON
- stores 
- - user Telegram ID
- - messages count since register
- - collection info
- `/deleteme` fully remove user data from db including ID

userData structure
    ```{
      "id": 13371337,
      "messagesCount": 1337,
      "lastPP": {
        "id": 0,
        "time": ""
      },
      "collection": {}
    }```


Will be updated soon

