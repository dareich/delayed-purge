# delayed-purge
Google sheet script that purges mail after a delay and keeps track in a spreadsheet.

# Overview
Do you suffer from a build up of occaisionally useful junk emails?  You don't want to delete that Shutterfly deal that expires in 4 days immediately, but in 4 days, you will probably forget to get rid of the thing.  Sadly, in no time at all, you are looking at a huge unread count in your inbox.  

This script is perfect for automatically cleaning up that junk.  

Add this script to a google spreadsheet to move emails in your GMail from a "delete me" label to trash once they have reached a certain age.  Configure the script to execute on a schedule and edit the settings right in the spreadsheet.

For data/dashboard geeks, the script logs the number of threads and messages removed right in the spreadsheet and the data is displayed in a nice chart.  You can see how much crap the script is purging on a daily basis.  There is also a correlation showing the time to delete vs. the number of threads.  Total Shiggles.

# Email Setup
1. [Create a new label](https://youtu.be/wxSFzN7aWMk) called "delete me" or anything else you want.  It can even be a sub label under "Admin Stuff"
1. Start [creating filters](https://youtu.be/ERGts28o_2I) to catch and label the stuff you want to delay purge.  Be sure to "apply filter" before saving the new filter to tag all the old emails.

Done.  New promotions are still in inbox so you can conveniently search for that "shutterfly deal I just saw a few days ago".

# Script Setup
1. Copy the text from here: **[Code.gs](Code.gs)**. (Click the link and select the text in the edit window with the line numbers - the numbers don't get copied. Be sure to select all the text)
1. [Create a blank Google Sheet](https://youtu.be/cPWcf9dqhnI). Name it whatever makes sense for you, like "Delay Email Purge".
1. Click on the menu **Tools -> Script Editor**...
1. Select all the text in the script window (eg. function myFunction...) and then **Paste** the code you copied earlier.
1. Save it (name it whatever - the same as the sheet works)
1. Go back to the sheet and hit the refresh button.  
1. After a few seconds, you will see a nice **"Delay Purge"** menu show up - probably next to the **"Help"** menu.
1. Open that menu and select the **"Setup Sheets"** item.  This will add the sheets the script uses to track its important work and "Settings" sheet where you control its behavior.
1. The script will ask for permission to run against your google account and the various data.  This script does not export the information anywhere or provide access to any other account.  It is completely limited to this script and your account.  Review the code and permissions if you have concerns.
1. The "Settings" sheet should be the curent active sheet, but if not, you can either select from the tabs at the botton of the screen, or use the **"Delay Purge -> Settings"** menu to activate it.
1. Make sure the default "delete me label" matches the label you setup above.
1. Add an email if you want detailed, daily reports on what the script is moving to trash. You will probably want to filter this email too.

# Testing and Scheduling
1. Under the **"Delay Purge"** menu select **"Test"**
1. Once the script has run, select the "TestData" sheet.  You will see a new row with today's date and some stats about the number of threads deleted (moved to trash).  If you see some other text, then something went wrong (like maybe the label name if misspelled).  Check your setup to make sure it is OK.
   - *Feel free to delete the "TestData" sheet.*
1. If the script ran properly, now you can schedule the actual cleanup task. 
1. In the script editor, click the little clock icon or choose **Edit -> Current project's triggers** menu item.  
   - This will open a new tab showing a fancy page where you add and edit triggers on the project.
   - Click the **Add Trigger** button in the bottom right pof the screen.
   - In the dialog that opens:
     - *Choose which function to run*: select **`cleanup`**
     - *Select event source*: select **Time-Driven**
     - *Select type of time based trigger*: **Day Timer** or whatever makes sense for you.
     - *Select time of daya*: usually midnight to 1am is good.

Running the script daily should be sufficient to keep your junk down, but you can run this as many times per day as you want. The stats accumulate on the single line for the day, so running the script often does not spam the data table.

You can also run the script by selecting the "Purge Now" menu under **"Delay Purge"**.  You might want to do that when first setting this up if you are like me and have thousands of junk emails built up.

# Notes

## Preventing Purging
If you don't want something purged, star the email and the script will not touch the thread.  You should also remove the "delete me" label to prevent the number of "starred" threads from building up. 

## Limitations
The script gets a list of threads from the "delete me" label and then loops through the list backwards to delete the oldest threads. Google apps limits the time the script can run to about 300 seconds.  If there are lot of emails to purge, the script may run out of time and delete what it can.  If the script has trouble deleting everything you expect it to, either manually run the cleanup or increase the frequency.  Look at the time column to see if the script timed out.  If it is greater than about 260 seconds, then you will need to run again.

## Error Display
In case there are errors, once you have resolved them, be sure to delete the rows that have the error information.  When you do that, also be sure to edit the Current Row value on the Settings sheet to ensure that the inputs continue at the right place.
