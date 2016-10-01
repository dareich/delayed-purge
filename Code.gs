var SettingsSheet = "Settings";
var DetailsSheet = "Details";
var DataSheet = "Data";

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function onOpen() {
  var ss = SpreadsheetApp.getActive();
  
  var isSettingsPreset = ss.getSheetByName(SettingsSheet) != null;
  var isDataPreset = ss.getSheetByName(DataSheet) != null;
  
  var menuItems = [];
  
  if (ss.getSheetByName(SettingsSheet)) {
    menuItems.push({name: 'Settings...', functionName: 'showSettings'})
  }
  if (!isSettingsPreset || !isDataPreset) {
    menuItems.push({name: 'Setup Sheets', functionName: 'initSheets'});
  }
  
  ss.addMenu('Delay Purge', menuItems);
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function showSettings() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    SpreadsheetApp.setActiveSheet(ss.getSheetByName(SettingsSheet));
}


//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function initSheets() {
  setupData();
  setupSettings();
  onOpen();
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function createSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return ss.insertSheet(sheetName);  
  }
  
  return null;
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function setupData() {
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Sheet1");
  
  if (!sheet) {
    sheet = createSheet(DataSheet);
  } else {
    sheet.setName(DataSheet);
  }
  
  if (!sheet) {
    return;    
  }
  
  var headerValues = [
      ["Current Row", 4, "Points to the last non-blank row.  The script will update that row if it runs on the same day.  If the script runs on a different day, it will automatically move to the next row.","","",""],
      ["","","","","",""],
      ["Date",	"Total Delayed Threads", "Deleted Threads", "Deleted Messages", "Time (sec)", "Passes"],
    ];

  var wraps = [
   [ false, false, false, false, false, false ],
   [ false, false, false, false, false, false ],
   [ true, true, true, true, true, true ],
  ];
  
  var range = sheet.getRange("A1:F3");
  range.setValues(headerValues);
  range.setWraps(wraps);
  
  // De-emphsize the current row tracking
  sheet.getRange("A1:C1").setFontColor("#888888");
    
  addAreaChart(sheet);
  addTimeVsMessagesChart(sheet);
  
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function addAreaChart(sheet) {
    
  var chart = sheet.newChart()
     .setChartType(Charts.ChartType.AREA)
     .addRange(sheet.getRange("A3:C365"))
     .setPosition(1, 7, 0, 0)
     .setOption('height', 600)
     .setOption('width', 900)
     .setOption('isStacked', true)
     .setOption('legend', {position: 'top'})
     .build();

  sheet.insertChart(chart);
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function addTimeVsMessagesChart(sheet) {
    
  var chart = sheet.newChart()
     .setChartType(Charts.ChartType.SCATTER)
     .addRange(sheet.getRange("C3:C365"))
     .addRange(sheet.getRange("E3:E365"))
     .setPosition(32, 7, 0, 0)
  .setOption('hAxis',{title : 'Number of deleted threads'})
  .setOption('vAxis',{title : 'Time (sec)'})
  .setOption('legend',{position : 'none'})
  .setOption('trendlines',  { 0: {type:'linear', label:'none'} })
     .build();

  sheet.insertChart(chart);
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function setupSettings() {
  var sheet = createSheet(SettingsSheet);
  
  if (!sheet) {
    return;    
  }
  
  sheet.setColumnWidth(3,450);
  
  var values = [
      ["Setting", "Value", "Description"],
      ["Delay to Delete", 15, "Threads older (in days) than this in the delete me label are moved to trash"],
      ["Delete me Label", "delete me", "Name of the delete me label.  If the label is sub label, then this is the full name.  e.g.  Parent/DeleteMe"],
      ["Report Email", "", "Email where the cleanup report is sent.  Leave blank to turn off emails."],
    ];
  
  var wraps = [
   [ false, false, true ],
   [ false, false, true ],
   [ false, false, true ],
   [ false, false, true ],
  ];

  var range = sheet.getRange("A1:C4").setValues(values);
  range.setValues(values);
  range.setWraps(wraps);
  
  sheet.getRange("A2:B3").setFontColor("#ff0000");
  sheet.getRange("A1:C1").setFontWeight("bold");
  
}


//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function getCurrentRowCell() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(DataSheet);
  
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
  var sheet = ss.getSheetByName(DataSheet);

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
  var sheet = ss.getSheetByName(DataSheet);

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
  setupData();
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