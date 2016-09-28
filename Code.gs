var SettingsSheet = "Settings";
var DetailsSheet = "Details";

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function getCurrentRowCell() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SettingsSheet);
  
  return sheet.getRange(1, 2);
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function getCurrentRow() {
  var nextRowVal = getCurrentRowCell().getValue();
  
  if (!nextRowVal) {
    nextRowVal = 1;
  }
  
  return Utilities.formatString("A%s:F%s", nextRowVal, nextRowVal);
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function incrementNextRow() {
  var cell = getCurrentRowCell();
  
  cell.setValue(cell.getValue() + 1);
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function getSetting(row) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SettingsSheet);
  
  return sheet.getRange(row,2).getValue();
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function getDelay() {
  return getSetting(2);
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function getDeleteMeLabel() {
  return getSetting(3);
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function getReportEmail() {
  return getSetting(4);
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function isRowToUse(today, range) {
  var dateVal = range.getCell(1, 1).getValue();
  
  if (!dateVal) {
    return true;
  } else if (range.getCell(1, 6).getValue() == "Error") {
    return false;
  } else {
    return dateVal.toDateString() == today;
  }
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function writeInfo(info) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Data");

  var d = new Date();

  // The size of the two-dimensional array must match the size of the range.
  var values = [
    [d.toDateString(), info.totalThreads, info.deletedThreads, info.deletedMessages, info.elapsed/1000.0, 1]
  ];

  // this row will either be blank (first time running script) or have some data in it.
  // If blank, fill it in.  
  // If not blank, check the date.
  //   if the date matches today's date, then grab the current values and add them to the data passed
  //      in so that we accumulate the totals on a daily basis.
  //   if the date does not match, go to the next row until you find either a matching date or a blank.
  var range = sheet.getRange(getCurrentRow());
  while (!isRowToUse(values[0][0], range)) {
    incrementNextRow();
    range = sheet.getRange(getCurrentRow());
  }

  // if the row is not blank, accumulate
  if (range.getCell(1, 1).getValue()) {
    // get the average number of delayed threads since not all are actually deleted
    var passes = range.getCell(1, 6).getValue();
    var totalDelayThreads = range.getCell(1, 2).getValue() * passes;
    
    values[0][1] = (values[0][1] + totalDelayThreads ) / (passes + 1);
    values[0][2] += range.getCell(1, 3).getValue();
    values[0][3] += range.getCell(1, 4).getValue();
    values[0][4] += range.getCell(1, 5).getValue();
    values[0][5] += range.getCell(1, 6).getValue();
  }
  
  range.setValues(values);
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function writeError(error) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Data");

  var d = new Date();

  // The size of the two-dimensional array must match the size of the range.
  var values = [
    [d.toDateString(), error, "", "", "", "Error"]
  ];

  incrementNextRow();
  var range = sheet.getRange(getCurrentRow());

  range.setValues(values);
  
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function addToFromMap(fromMap, from) {
    if (!fromMap[from]) {
      fromMap[from] = 1;
    } else {
      var cnt = fromMap[from];
      cnt++;
      fromMap[from] = cnt;
    }
}
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function logSenders(fromMap, messages) {
  for (var i = 0; i < messages.length; i++) {
    addToFromMap(fromMap, messages[i].getFrom());
  }
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function readDetails() {
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DetailsSheet);
  
  var d = new Date();
  var ret = {date:d.toDateString(), fromMap : {}};
  
  if (!sheet) {
    return ret;
  }
  
  var lastDate = sheet.getRange(1,1).getValue();
  
  // assume sheet is empty if there is no date
  if (!lastDate) {
    return ret;
  } else {
    ret.date = lastDate.toDateString();
  }
  
  var dataRow = 2;
  var range = sheet.getRange(Utilities.formatString("A%s:B%s", dataRow, dataRow));
  while(range.getCell(1,1).getValue()) {
    ret.fromMap[range.getCell(1,1).getValue()] = range.getCell(1,2).getValue();
    dataRow++;
    range = sheet.getRange(Utilities.formatString("A%s:B%s", dataRow, dataRow));
  }

  return ret;  
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function writeDetails(details) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DetailsSheet);
  
  if (!sheet) {
    sheet = ss.insertSheet(DetailsSheet);
  } else {
    sheet.clear();
  }
  
  sheet.getRange(1, 1).setValue(details.date);
  
  var dataRow = 2;
  for(var key in details.fromMap) {
    var values = [
      [key, details.fromMap[key] ]
    ];

    var range = sheet.getRange(Utilities.formatString("A%s:B%s", dataRow, dataRow));
    range.setValues(values);
    
    dataRow++;
  }
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function initDetails() {
  var savedDetails = readDetails();
  var d = new Date();
  
  if (d.toDateString() == savedDetails.date) {
    return {current : savedDetails, previous : null };
  } else {
    return {current : {date:d.toDateString(), fromMap : {}}, previous : savedDetails };
  }
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function sendDetailReport(reportAddress, details) {

  var userName = Session.getActiveUser().getEmail();
  var body = Utilities.formatString("On %s, the following messages in %s were moved to trash\n", details.date, userName);
  var totalMessages = 0;
  
  for(var key in details.fromMap) {
    body += Utilities.formatString("%s from %s\n", details.fromMap[key], key);
    totalMessages += details.fromMap[key];
  }
  
  body += Utilities.formatString("A total of %s messages were moved\n", totalMessages);
  
  GmailApp.sendEmail(reportAddress, "Auto Cleanup Stats", body);

}

//////////////////////////////////////////////////////////////////
// Execute this function to make sure the settings are correct.
// It does not actually move anything to trash, but it counts and 
// reports as if it does.  You can see the entries in the sheet.
//////////////////////////////////////////////////////////////////
function cleanupTest() {
  cleanupMail(function(threadsToDelete) { 
    return threadsToDelete.length; 
  });

}

//////////////////////////////////////////////////////////////////
// This is the function to schedule daily.
//////////////////////////////////////////////////////////////////
function cleanup() {
  cleanupMail(function(threadsToDelete) { 
    GmailApp.moveThreadsToTrash(threadsToDelete);
    return threadsToDelete.length; 
  });
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function cleanupMail(moveToTrash) {
  var start = new Date();
  
  var delayDays = getDelay();
  if (!delayDays) {
    writeError("Must specify a non-zero, non-blank number of days to delay the move the trash.");
    return;
  }
  
  var reportEmail = getReportEmail();
  var labelName = getDeleteMeLabel();
    
  var label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    writeError(Utilities.formatString("Could not find label '%s'", labelName));
    return;
  }
  
  var maxDate = new Date();
  maxDate.setDate(maxDate.getDate() - delayDays);
  
  // Note, this will return a max of 500 threads.  
  var threads = label.getThreads();
 
  var details = initDetails();
  
  var info = {
    totalThreads:threads.length,
    deletedThreads:0,
    deletedMessages:0,
    elapsed:0
  };
  
  var currElapsed = (new Date()) - start;

  var threadsToDelete = [];
  
  // Scripts time out after about 300 seconds.  So, loop through as many threads
  // as we can by 260 seconds before bailing out.
  for (var i = threads.length-1; i >= 0 && currElapsed < 260000; i--) {
    var thread = threads[i];
    if (!thread.hasStarredMessages() && thread.getLastMessageDate() < maxDate)
    {
      if (reportEmail) {
        // this takes quite a bit of time - skip if not sending a detailed report.
        logSenders(details.current.fromMap, thread.getMessages());
      }
      
      info.deletedMessages += thread.getMessageCount();
      threadsToDelete.push(thread);        
    }
    
    // delete threads limits to 100.
    if (threadsToDelete.length >= 100) {
      info.deletedThreads += moveToTrash(threadsToDelete);
      threadsToDelete = [];
    }
    currElapsed = (new Date()) - start;
  }
  
  info.deletedThreads += moveToTrash(threadsToDelete);
  
  info.elapsed = (new Date()) - start;
  
  Logger.log(info);
  writeInfo(info);
  writeDetails(details.current);
  
  if (reportEmail && details.previous) {
    sendDetailReport(reportEmail, details.previous);
  }
  
}