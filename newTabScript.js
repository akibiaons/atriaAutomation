// NEWTABSCRIPT.JS **
// Step 4: running the scripts for the new tab **

// utility functions defined here below:
// let hasProcessedModal = false;

if (window.hasInjectedScript) {
  throw new Error("Script already injected");
}
window.hasInjectedScript = true;
//Clicks a certain button that says "Create household"
function clickSpan() {
  let success = false; // flag to indicate if click was successful
  // let wasClicked = false;  // Boolean to track if the desired span was clicked. another way of reading above^

  // Fetch all span elements in the document.
  let spans = document.querySelectorAll("span");

  // Loop through each span and click if it matches the desired text.
  spans.forEach((span) => {
    if (span.textContent.includes("Create a new household")) {
      // Create a new mouse event
      let event = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      // Dispatch the event on the target element...
      span.dispatchEvent(event);
      success = true; // Return whether the desired span was clicked or not.
    }
  });
  return success; // Return the status
}

// Below is the function to click the add button span element in order to submit name data to the database...

function setInputValueByAriaLabel(label, value) {
  const element = findElementByAriaLabel(label);
  if (element) {
    element.value = value;
    // Manually trigger a change event
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function findElementByAriaLabel(label) {
  return document.querySelector(`[aria-label="${label}"]`);
}

function setupMutationObserverForModal(data) {
  const targetNode = document.body;
  const config = { attributes: false, childList: true, subTree: true };
  const callback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        if (mutation.target.querySelector(".modal-draggable-handle")) {
          console.log("MODAL DETECTED");
          processExcelData(data);

          // Disconnect the current observer since we found the modal
          observer.disconnect();

          // Setup another observer to detect the removal of the modal
          setupObserverForModalRemoval();
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

function setupObserverForModalRemoval() {
  const targetNode = document.body;
  const config = { attributes: false, childList: true, subTree: true };
  const callback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
        const modalRemoved = Array.from(mutation.removedNodes).some(
          (node) =>
            node.querySelector && node.querySelector(".modal-draggable-handle")
        );
        if (modalRemoved) {
          console.log("MODAL REMOVED");
          clickSaveAndContinue();

          // Disconnect the observer since we detected the removal of the modal
          observer.disconnect();
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

function clickSaveAndContinue() {
  // Look for the button with text "Save and continue"
  let buttons = document.querySelectorAll("button");
  for (let button of buttons) {
    if (button.textContent.includes("Save and continue")) {
      console.log(`BUTTON FOUND WITH STRING "SAVE AND CONTINUE"`, button);

      // Introduce a 2-second delay (2000 milliseconds) before clicking the button
      setTimeout(() => {
        // Create a new mouse event
        let event = new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: true,
        });
        // Dispatch the event on the button
        button.dispatchEvent(event);
        clickRiskToleranceButtonAfterDelay();
      }, 2000);

      return;
    }
  }
  console.log("Save and continue button not found");
}

function clickRiskToleranceButtonAfterDelay() {
  setTimeout(() => {
    const button = document.querySelector(
      'button[aria-label="I already know my client\'s risk tolerance"]'
    );
    if (button) {
      button.click();
      console.log("Clicked the risk tolerance button.");
    } else {
      console.error("Risk tolerance button not found.");
    }
  }, 5000); // Delay of 5 seconds (5000 milliseconds)
}

function addNameClick() {
  let success = false; // Flag to indicate if click was successful.
  let container = document.querySelector(".MuiDialogContent-root");
  if (!container) {
    console.log("Container not found");
    return false;
  }
  console.log("MODAL FOUND: Searching <SPANS> 🔎");
  let spans = container.querySelectorAll("span");
  spans.forEach((span) => {
    if (span.textContent.includes("Add")) {
      console.log(`SPAN FOUND WITH STRING "ADD"`, span);
      // Create a new mouse event
      let event = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      // Dispatch the event on the target element...
      span.dispatchEvent(event);
      success = true;
    }
  });
  return success; // Return the status
}

// Listener to act upon receiving messages from the Chrome extension.
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "automateData") {
    console.log("Excel data retrieved:", message.data);

    // Ensure webpage content (DOM) is fully loaded before taking action.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        const openName = clickSpan(); // call the autoclicker here
        setupMutationObserver(message.data);
        sendResponse({ status: openName ? "success" : "error" });
      });
    } else {
      //DOMContentLoaded already has fired
      const openName = clickSpan(); // Calling the span clicker here...
      setupMutationObserver(message.data);
      sendResponse({ status: openName ? "success" : "error" });
    }
    return true;
  }
});

function processExcelData(data) {
  console.log("Processing data: ", data);
  // Check if data is an array and has the required index
  if (Array.isArray(data) && data.length > 29) {
    const formData = data[29]; // For example, using the 30th item in the array
    const clientTitle = formData.CLIENT_TITLE || "Default Title"; // Fallback value
    const firstName = formData.FIRST_NAME || "Default FName"; // Fallback value for name
    const lastName = formData.LAST_NAME || "Default LNAME"; //Fallback for last name
    setInputValueByAriaLabel("Enter household name", clientTitle);
    setInputValueByAriaLabel("First name", firstName);
    setInputValueByAriaLabel("Last name", lastName);
  } else {
    console.error("Invalid data format or index out of bounds");
  }
  // Additional processing...
  setTimeout(() => {
    const addClicked = addNameClick();
    console.log("Add button clicked? :", addClicked);
    if (addClicked) {
      setupObserverForModalRemoval(); // Set up the observer only if "Add" was clicked.
    }
  }, 2000); // Adjust delay too long is noticable to short will mess up flow...
}
