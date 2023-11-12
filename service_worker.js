// BACKGROUND.JS
// This is step 3 - after proposal button is clicked on the my.advisor page

const injectedTabs = new Set();
let currentIndex = 29; // Starting index
let excelData; // Array of data from Excel sheet

// Save current index to storage
chrome.storage.local.set({ currentIndex: currentIndex });

// Load current index from storage
chrome.storage.local.get("currentIndex", function (data) {
  currentIndex = data.currentIndex || 29; // Default to 29 if not set
});

// Function to process an array
function processArray(index) {
  if (index < excelData.length) {
    // Assuming you have a logic to open a new tab or navigate to the URL
    openTabOrNavigate(); // Replace this with your actual function to open/navigate to the tab
  } else {
    console.log("All arrays processed");
    // End process or perform any final steps
  }
}

// This part of the script monitors any navigation to certain URLS **
// As shown in the declaration for "targetURLS = [...]" **
// If matching URL is found, this will inject another js file (newTabScript.js) **
// into the tab (that its currently on) and sends some data over to the extensions local storage. **
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // Below I am defining all the url paths in the SPA for ENVESTNET form....
  const targetUrls = [
    "https://my.advisorlogin.com/secure/proposalapp/#/household",
    "https://my.advisorlogin.com/secure/proposalapp/#/riskAndObjective",
    "https://my.advisorlogin.com/secure/proposalapp/#/strategies",
    "https://my.advisorlogin.com/secure/proposalapp/#/accountSetup",
    "https://my.advisorlogin.com/secure/proposalapp/#/fees",
    "https://my.advisorlogin.com/secure/proposalapp/#/overview",
  ];

  // Check if any of the URLs is in the updated tab's URL
  const isTargetUrl = tab.url
    ? targetUrls.some((part) => tab.url.includes(part))
    : false;

  // Reacting to Complete Page Load for Target URL //
  // Check for updated tab to see if it is done loading ("status === 'complete'")
  if (changeInfo.status === "complete" && isTargetUrl) {
    // Check if the script has already been injected into this tab
    if (injectedTabs.has(tabId)) {
      return; // If already injected, exit early
    }
    // Stored and parsed excel data will be fetched
    chrome.storage.local.get("excelData", function (data) {
      // Error check
      if (chrome.runtime.lastError) {
        console.error("Error retreiving the data:", chrome.runtime.lastError);
        return;
      }
      // Declaration for extracted excelData
      const excelData = data.excelData;

      // Injecting a Script into a Tab:
      chrome.scripting.executeScript(
        // Parameters and its given data
        {
          target: { tabId: tabId },
          files: ["newTabScript.js"],
        },
        (injectionResults) => {
          injectedTabs.add(tabId); // Add tabId to the set after successful injection
          // Iterating over Injection Results:
          for (const frameResult of injectionResults) {
            // Error check
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
              return;
            }

            // _DEV USE ONLY
            // Success log
            console.log("script injected test");

            // Sending Message After Delay:
            setTimeout(() => {
              console.log("Sending automateData message to tab");
              chrome.tabs.sendMessage(tabId, {
                action: "automateData",
                data: excelData, // Passing the excelData here to newTabScript.js
              });
            }, 2000); // A 2 second delay
          }
        }
      );
    });
  }
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  injectedTabs.delete(tabId);
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "closeTab") {
    // Close the current tab
    chrome.tabs.remove(sender.tab.id, function () {
      console.log("Tab closed");
      currentIndex++; // Increment for the next item
      if (currentIndex < excelData.length) {
        // Send a message to inject.js to start the next proposal
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "startNextProposal",
          currentIndex: currentIndex,
        });
      }
    });
  }
});
