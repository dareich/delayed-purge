# delayed-purge
Google sheet script that purges mail after a delay and keeps track in a spreadsheet.

# Overview
Add this script to a google spreadsheet to move emails in your GMail from a "delete me" label to trash once they have reached a certain age.  Configure the script to execute on a schedule and edit the settings right in the spreadsheet.

This is perfect for automatically cleaning out those promotional emails that are occaisionally handy.  You don't want to delete that Shuuterfly deal that expires in 4 days immediately, but in 4 days, you will probably forget to get rid of the thing.

For data/dashboard geeks, the script logs the number of threads and messages removed right in the spreadsheet and the data is displayed in a nice chart.  You can see how much crap the script is purging on a daily basis.  There is also a correlation showing the time to delete vs. the number of threads.  Total Shiggles.

# Email Setup
1. Create a new label called "delete me" or anything else you want.  It can even be a sub label under "Admin Stuff"
1. Start creating filters to catch and label the stuff you want to delay purge.  Be sure to "apply filter" before saving the new filter to tag all the old emails.

Done.  New promotions are still in inbox so you can conveniently search for that "shutterfly deal I just saw a few days ago".

# Script Setup
1. Create a blank Google Sheet
1. Go to Tools -> Script Editor...
1. Copy and paste the Code.gs text into the script. 
1. Save it
1. First run the **`initSheets`** function by selecting it in the "Select Fuction" dropdown and presssing the run button.
1. The script will ask for permission to run against your google account and the various data.  This script does not export the information anywhere or provide access to any other account.  It is completely limited to this script and your account.  Review the code and permissions if you have concerns.
1. Go back to the sheet and open the Settings sheet.  Make sure the default "delete me label"
matches the label you setup above.  Add an email if you want detailed, daily reports.

# Testing
1. Select the **`cleanupTest`** function where it says "Select Fuction" and press the run button.
1. Once the script has run, go back the sheet and select the "Data" sheet.  You will see a new row with today's date and some stats about the number of threads deleted.  If you see some other text, then something went wrong.  Check your setup to make sure it is OK.
1. If the script ran properly, now you can schedule the actual cleanup task.  
 1. First, clean up the test data
  1. Delete the row just entered.  You also need to change the "Current Row" value at the top of the "Data" sheet so the real data starts in the right place.
  1. **OR**, you can delete the Data sheet.  The **`cleanup`** function automatically creates a new sheet when it runs.
1. In the script editor, click the little clock icon or choose Resources -> Current project's triggers menu item.  In the dialog, add a new trigger to run **`cleanup`** and select whatever time based trigger you want.  Daily should work.

# Notes

## Preventing Purging
If you don't want something purged, star the email and the script will not touch the thread.  You should also remove the "delete me" label to prevent the number of "starred" threads from building up. 

## Limitations
The script gets a list of threads from the "delete me" label and then loops through the list backwards to find the oldest threads.  Google apps limits the number to 500 and the script does not do any additional passes.  Therefore, it is possible that not all the old emails are purged when the script runs.  If you see the total delayed threads sitting at 500 for a fiew days, then you might have to increase the frequency of the script running to keep up.

## Error Display
In case there are errors, once you have resolved them, be sure to delete the rows that have the error information.  When you do that, also be sure to edit the Current Row value on the Settings sheet to ensure that the inputs continue at the right place.
