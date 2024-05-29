**PPBot**
Author: https://t.me/leet_plus

Telegram bot for all the Dudes

**Prequisites**

Node.js
created Telegram bot via @BotFather
bot secret from @BotFather

Compatibility:

Checked only on Windows 11, Ubuntu maybe you need to fix paths to use on other os

**Installation**

checkout folder to any place
run PowerShell from checkout folder (RMB -> Open in Terminal)
run npm install
make sure to make /app/storage/settings.json from /app/storage/settings-template.json with your token and credentials
run npm start

add bot to chat as admin (it is required to get access to messages)
or text to your bot @your_bot_name directly

**Usage**

/go - registers user with defaultUser data and Telegram ID
/roll - Gives user random PP of the Day or show recieved if timeout is not reached
/top - use with any number to check its stats, or if it is added
/me - shows user data stats All bot answers are replies to request message

**User Data**

```saved as JSON
stores in Firebase realtime database
- all database usage logs to console in debug layer
user Telegram ID
collect stats
user can roll collectibles
/deleteme fully remove user data from db including ID
userData structure in settings-template.json```

*Will be updated sometime*