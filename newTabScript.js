// NEWTABSCRIPT.JS **
// Step 4: running the scripts for the new tab **

// Utility functions defined here below:

// Step one, get data... data obtained, start automation
// Listener to act upon receiving messages from the Chrome extension.
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "automateData") {
    // Ensure webpage content (DOM) is fully loaded before taking action.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        const openName = clickSpan(); // call the autoclicker here
        setupMutationObserverForModal(message.data);
        sendResponse({ status: openName ? "success" : "error" });
      });
    } else {
      //DOMContentLoaded already has fired
      const openName = clickSpan(); // Calling the span clicker here...
      setupMutationObserverForModal(message.data);
      sendResponse({ status: openName ? "success" : "error" });
    }
    return true;
  }
});

// Step two, click "Create household" button
function clickSpan() {
  let success = false; // flag to indicate if click was successful

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
      // _DEV USE
      console.log("Creating new household button...");
    }
  });
  return success; // Return the status
}

// Step three-one
const riskToleranceToPercentage = {
  "Capital Preservation": 7,
  Conservative: 21.5,
  "Conservative Growth": 36,
  Moderate: 50,
  "Moderate Growth": 64,
  Growth: 78.5,
  Aggressive: 93,
};

let globalRegistrationType = "";
let globalCustodianType = "";
let globalProposalAmount = 0;
let globalProgram = "";
let globalRiskTolerance = "";
let nameOnPortfolio = "";
let feeSchedule = "";
let feeTemplate = "";
// Find modal
function setupMutationObserverForModal(data) {
  const targetNode = document.body;
  const config = { attributes: false, childList: true, subTree: true };

  const callback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        if (mutation.target.querySelector(".modal-draggable-handle")) {
          console.log("MODAL_DETECTED");
          processExcelData(data);

          // Disconnect the current observer since we found the modal
          observer.disconnect();

          // Setup another observer to detect the removal of the modal
          // setupObserverForModalRemoval();
        }
      }
    }
  };
  // Once modal is found:
  // Step three-two
  // Give aria labels definitions
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

  // Step three-three
  // Now Run processExcelData()

  // Pre defining addNameClick()
  function addNameClick() {
    let success = false; // Flag to indicate if click was successful.
    let container = document.querySelector(".MuiDialogContent-root");
    if (!container) {
      console.log("MODAL_NOT_FOUND");
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

      globalRegistrationType = formData.REGISTRATION || "Default Registration";
      globalCustodianType = formData.CUSTODIAN || "Default Registration";
      globalProposalAmount = formData.ACCOUNT_VALUE || 0;
      globalProgram = formData.PROGRAM || "";
      globalRiskTolerance = formData.PORTFOLIO_RISK || "";
      nameOnPortfolio = formData.NAME_ON_PORTFOLIO || "";
      feeSchedule = formData.BILLING_FFREQUENCY || "Monthly";
      feeTemplate = formData.ADVISOR_FEE || "Standard";
    } else {
      console.error("Invalid data format or index out of bounds");
    }

    // Additional processing...
    setTimeout(() => {
      // Step three-four
      // Click "Add" inside of modal
      const addClicked = addNameClick();
      console.log("Add button clicked? :", addClicked);

      // Step three-five
      // Once addClicked, run modal Closer
      if (addClicked) {
        setupObserverForModalRemoval(); // Set up the observer only if "Add" was clicked.
      }
    }, 3000); // Adjust delay too long is noticable to short will mess up flow...
  }

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

// Step three-six
// Close modal
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
          // Once the setupObserverForModalRemoval() is ran it will start the next function clickSaveAndContinue()
          setTimeout(() => {
            clickSaveAndContinue();
          }, 4000);

          // Disconnect the observer since we detected the removal of the modal
          observer.disconnect();
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}
// Step four-one save and continue into the new risk and objective functions sections....
function clickSaveAndContinue() {
  // Look for the button with text "Save and continue"
  let buttons = document.querySelectorAll("button");
  for (let button of buttons) {
    if (button.textContent.includes("Save and continue")) {
      console.log(`BUTTON FOUND WITH STRING "SAVE AND CONTINUE"`, button);

      setTimeout(() => {
        // Create a new mouse event
        let event = new MouseEvent("click", {
          view: window,
          bubbles: true,
          cancelable: true,
        });
        // Dispatch the event on the button
        button.dispatchEvent(event);

        // Step four-one
        // Click "I know my clients risk tolerance" button
        clickRiskToleranceButtonAfterDelay();
      }, 3000);

      return;
    }
  }
  console.log("Save and continue button not found");
}
// Step four-two
// Click that we know our client's risks...
function adjustRiskToleranceSlider() {
  const percentage = riskToleranceToPercentage[globalRiskTolerance] || 50; // Default to 50 if no match is found
  clickSliderAtPosition(percentage);
}

function clickRiskToleranceButtonAfterDelay() {
  setTimeout(() => {
    const button = document.querySelector(
      'button[aria-label="I already know my client\'s risk tolerance"]'
    );
    if (button) {
      button.click();
      console.log("Clicked the 'I already know the risk tolerance' button.");

      // Introduce a delay after clicking the risk tolerance button and then adjust the slider
      setTimeout(() => {
        // Step four-two
        // Click slider to its proper location
        adjustRiskToleranceSlider();
      }, 2000); // Delay of 2 seconds (2000 milliseconds) to adjust the slider after clicking the button
    }
  }, 5000); // Delay of 5 seconds (5000 milliseconds) to click the button
}

// Step four-three
// Slide the correlating client risks, based on RISK_ASSESSMENT::
function clickSliderAtPosition(percentage) {
  const sliderContainers = document.querySelectorAll('div[role="button"]');

  const slider = Array.from(sliderContainers).find((container) => {
    return Array.from(container.children).some((child) =>
      child.style.left.includes("calc")
    );
  });

  if (slider) {
    const rect = slider.getBoundingClientRect();
    const clickX = rect.left + rect.width * (percentage / 100);
    const clickY = rect.top + rect.height / 2;

    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: clickX,
      clientY: clickY,
    });

    slider.dispatchEvent(clickEvent);
    setTimeout(() => {
      // Step four-two
      // Click slider to its proper location
      clickRiskAssessmentDropdown();
      console.log("Clicked assessment dropdown");
    }, 2000);
  }
}

// Step four-four
// Open the dropdown after the slider
function clickRiskAssessmentDropdown() {
  const dropdown = document.querySelector(
    "div.MuiSelect-root[aria-haspopup='listbox']"
  );

  if (dropdown) {
    dropdown.focus();
    ["mousedown", "mouseup", "click"].forEach((eventType) => {
      dropdown.dispatchEvent(
        new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
    });
    setTimeout(() => {
      console.log("going to click n ext options");
      clickRiskAssessmentOption();
    }, 2000);
  }
}

// Step four-five
// Click the option after dropdown is clicked and opened...
function clickRiskAssessmentOption() {
  const optionText =
    "Existing client (Current risk-tolerance questionnaire is on file)";

  // Define a function to click the target option when it's available
  const tryClickOption = () => {
    const options = Array.from(
      document.querySelectorAll("ul.MuiList-root li.MuiMenuItem-root")
    );
    const targetOption = options.find((option) =>
      option.textContent.includes(optionText)
    );

    if (targetOption) {
      targetOption.click();
      console.log("Clicked option - MAIN FUNC");
      clickTermsCheckbox();
      return true; // Indicate success
    }
    return false; // Indicate failure
  };

  // Create an observer instance
  const observer = new MutationObserver((mutations, obs) => {
    if (tryClickOption()) {
      // Try to click the option
      obs.disconnect(); // If successful, disconnect the observer
    }
  });

  // Start observing the body for changes in the DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Try to click the option immediately in case it's already there
  if (!tryClickOption()) {
    // If the option was not clicked successfully, trigger the dropdown to show options
    setTimeout(() => {
      const dropdown = document.querySelector("div.MuiSelect-root");
      if (dropdown) {
        dropdown.click();
        console.log("Clicked option - BACKUP FUNC");
        clickTermsCheckbox();
      }
    }, 300); // Adjust the timeout as necessary
  } else {
    observer.disconnect(); // If we clicked the option, disconnect the observer
  }
}
// Step four-six
// Click the terms dropdown...
function clickTermsCheckbox() {
  // Find button by its role and aria-label attributes
  const checkBoxButton = document.querySelector(
    'button[role="checkbox"][aria-label="I confirm the terms and conditions for selecting my client\'s risk"]'
  );

  if (checkBoxButton) {
    checkBoxButton.click();
    console.log("Checkbox button clicked!");
    setTimeout(() => {
      console.log("Clicking agree to terms button");
      termsCheckboxConfirmation();
    }, 2000);
  }
}
// Step four-seven
// Click the checkbox to accept current clients risk and investment objective...
function termsCheckboxConfirmation() {
  // Use XPath to find the button based on its text content
  var xpath = "//button[.//span[contains(text(), 'I agree')]]";
  var agreeButton = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;

  if (agreeButton) {
    agreeButton.click();
    console.log("Agree button clicked!");
    setTimeout(() => {
      // Timeout to kickstart the saveandcontinue button
      console.log("Clicking agree to terms button");
      saveAndContinueRandO();
    }, 1000);
  } else {
    console.log("Agree button not found!");
  }
}

// Step four-eight: Confirm selected options, save and continue...
function saveAndContinueRandO() {
  let spanFound = false;
  let spans = document.querySelectorAll("span");

  for (let span of spans) {
    if (span.textContent.includes("Save and continue")) {
      console.log(`SPAN FOUND WITH STRING "SAVE AND CONTINUE"`, span);
      spanFound = true;

      setTimeout(() => {
        span.click(); // Simpler way to click without creating a MouseEvent
        console.log("Clicked 'Save and continue'");

        setTimeout(() => {
          // This delay waits for the page to process the save and continue action
          clickAddAccountButton();
        }, 7000); // The delay might need adjustment based on actual page behavior
      }, 5000); // Waiting for animations to complete

      break; // Exit the loop as we've found and clicked the span
    }
  }

  if (!spanFound) {
    console.log("Save and continue span not found");
    // Handle the error case appropriately, possibly retrying or alerting the user
  }
}

// BELOW ARE THE FUNCTIONS TO MANIPULATE THE ACCOUNT STRATEGY SECTION

//Version 0.39.1 - Nov 7 2023
// step five-one: Click the add account button
function clickAddAccountButton() {
  let spans = document.querySelectorAll("span");

  for (let span of spans) {
    if (span.textContent.trim() === "Add account") {
      // Using trim() to remove any leading/trailing whitespace
      let button = span.closest("button");
      if (button) {
        button.click();
        console.log('Clicked "Add account" button.');
        return true;
      }
    }
    setTimeout(() => {
      console.log("Inputting proposal amount...");
      setProposalAmount();
    }, 5000);
  }

  console.log("Add account button not found.");
  // Similar to above, handle the error case appropriately
  return false;
}

function setProposalAmount() {
  // Find the input field for the proposal amount by its aria-label
  const proposalAmountInput = document.querySelector(
    'input[aria-label="Proposal amount"]'
  );

  if (proposalAmountInput) {
    // Parse the globalProposalAmount as a float number and ensure it's a finite number
    const amount = parseFloat(globalProposalAmount);
    if (isFinite(amount)) {
      // Set the value of the input to the numeric globalProposalAmount
      proposalAmountInput.value = amount;

      // Simulate a change event to notify any JavaScript listening to this event
      const event = new Event("change", { bubbles: true });
      proposalAmountInput.dispatchEvent(event);

      console.log(`Proposal amount set to ${amount}`);
    }
  }
  setTimeout(() => {
    console.log("Clicking registration dropdown...");
    clickRegistrationTypeDropdown();
  }, 2000);
}

// step five-three: Click select registration type
function clickRegistrationTypeDropdown() {
  const dropdown = document.querySelector(
    'div.MuiSelect-root[aria-haspopup="listbox"]'
  );

  if (dropdown) {
    dropdown.focus();
    ["mousedown", "mouseup", "click"].forEach((eventType) => {
      dropdown.dispatchEvent(
        new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
    });

    setTimeout(() => {
      console.log("Preparing to select an option...");
      clickRegistrationTypeOption();
    }, 2000); // 2-second delay
  }
}

function clickRegistrationTypeOption() {
  // Define a function to click the target option when it's available
  const tryClickOption = () => {
    const options = Array.from(
      document.querySelectorAll("ul.MuiList-root li.MuiMenuItem-root")
    );
    const targetOption = options.find((option) =>
      option.textContent.includes(globalRegistrationType)
    );

    if (targetOption) {
      targetOption.click();
      console.log(
        `Clicked registration type option: ${globalRegistrationType}`
      );
      setTimeout(() => {
        console.log("Preparing to select an option...");
        clickCustodianDropdown();
      }, 4000); // 2-second delay

      return true; // Indicate success
    }
    return false; // Indicate failure
  };

  // Create an observer instance
  const observer = new MutationObserver((mutations, obs) => {
    if (tryClickOption()) {
      // Try to click the option
      obs.disconnect(); // If successful, disconnect the observer
    }
  });

  // Start observing the body for changes in the DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Try to click the option immediately in case it's already there
  if (!tryClickOption()) {
    // If the option was not clicked successfully, trigger the dropdown to show options
    setTimeout(() => {
      const dropdown = document.querySelector("div.MuiSelect-root");
      if (dropdown) {
        dropdown.click();
        console.log("Opened dropdown - waiting for options...");
      }
    }, 300); // Adjust the timeout as necessary
  } else {
    observer.disconnect(); // If we clicked the option, disconnect the observer
  }
}

// step five-three: Click select registration type
function clickCustodianDropdown() {
  // Query the document for the dropdown element
  const dropdownSpans = Array.from(
    document.querySelectorAll(
      'div.MuiSelect-root[aria-haspopup="listbox"] > span'
    )
  );
  const custodianDropdown = dropdownSpans.find(
    (span) => span.textContent === "Select a custodian"
  )?.parentNode;

  if (custodianDropdown) {
    // Focus on the dropdown element
    custodianDropdown.focus();

    // Dispatch mouse events to mimic the user's actions
    ["mousedown", "mouseup", "click"].forEach((eventType) => {
      custodianDropdown.dispatchEvent(
        new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
    });

    // Set a timeout to handle subsequent actions
    setTimeout(() => {
      console.log("Preparing to select an option...");
      clickCustodianOption();
    }, 4000); // 2-second delay
  }
}

function clickCustodianOption() {
  // Define a function to click the target option when it's available
  const tryClickOption = () => {
    const options = Array.from(
      document.querySelectorAll("ul.MuiList-root li.MuiMenuItem-root")
    );
    const targetOption = options.find((option) =>
      option.textContent.includes(globalCustodianType)
    );

    if (targetOption) {
      targetOption.click();
      console.log(`Clicked registration type option: ${globalCustodianType}`);
      // Add any additional logic you need after clicking the option
      setTimeout(() => {
        console.log("Preparing to select an option...");
        selectExistingStrategy();
      }, 4000); // 2-second delay
      return true; // Indicate success
    }
    return false; // Indicate failure
  };

  // Create an observer instance
  const observer = new MutationObserver((mutations, obs) => {
    if (tryClickOption()) {
      // Try to click the option
      obs.disconnect(); // If successful, disconnect the observer
    }
  });

  // Start observing the body for changes in the DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Try to click the option immediately in case it's already there
  if (!tryClickOption()) {
    // If the option was not clicked successfully, trigger the dropdown to show options
    setTimeout(() => {
      const dropdown = document.querySelector("div.MuiSelect-root");
      if (dropdown) {
        dropdown.click();
        console.log("Opened dropdown - waiting for options...");
      }
    }, 4000); // Adjust the timeout as necessary
  } else {
    observer.disconnect(); // If we clicked the option, disconnect the observer
  }
}

// // Function to find and click on the span that opens the modal for selecting an existing strategy
function selectExistingStrategy() {
  let spans = document.querySelectorAll("span");

  for (let span of spans) {
    // Using trim() to ensure there are no leading/trailing spaces
    if (span.textContent.trim() === "Select an existing strategy") {
      // Simulate a click on this span
      span.click();
      console.log('Clicked "Select an existing strategy" span.');
      setTimeout(() => {
        console.log("Preparing to select an option...");
        clickProgramOptionByContent(globalProgram);
      }, 2000); // 2-second delay
      return true; // Indicate that the span was found and clicked
    }
  }

  console.log("Select an existing strategy span not found.");
  return false; // Indicate that the span was not found
}

function clickProgramOptionByContent(programString) {
  // Define a function to click the target option when it's available
  const tryClickProgramOption = () => {
    const options = Array.from(
      document.querySelectorAll("button[role='radio']")
    );
    const targetOption = options.find((option) => {
      const labelSpan = option.nextElementSibling;
      return labelSpan && labelSpan.textContent.includes(programString);
    });

    if (targetOption) {
      targetOption.click();
      console.log(`Clicked program option with string "${programString}"`);

      setTimeout(() => {
        console.log("Preparing to select an option...");
        clickStartSelectingButton();
      }, 20000);
      return true; // Indicate success
    }
    return false; // Indicate failure if the target option wasn't found
  };

  // Create an observer instance to watch for when the modal is added to the DOM
  const observer = new MutationObserver((mutations, obs) => {
    if (tryClickProgramOption()) {
      obs.disconnect(); // If successful, disconnect the observer
    }
  });

  // Start observing the body for changes in the DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Try to click the program option immediately in case it's already visible
  if (!tryClickProgramOption()) {
    console.log("Waiting for modal to appear...");
  }
}

function clickStartSelectingButton() {
  // Look for the button with the aria-label "Start Button"
  let buttons = document.querySelectorAll('button[aria-label="Start Button"]');
  for (let button of buttons) {
    button.click();
    setTimeout(() => {
      setInputValueForNameFilterWhenModalAppears(nameOnPortfolio);
    }, 5000);

    return; // Exit the function after clicking the button
  }
}

function setInputValueForNameFilterWhenModalAppears(inputValue) {
  const trySetInputValue = () => {
    const input = document.querySelector(
      `.MuiDrawer-root input[placeholder="Filter by name"]`
    );

    if (input) {
      input.focus();
      input.value = inputValue;
      ["change", "input"].forEach((event) => {
        input.dispatchEvent(new Event(event, { bubbles: true }));
      });

      console.log(`Set input value to "${inputValue}"`);

      observeTableAndFindRow(nameOnPortfolio);

      return true; // Indicate success
    }
    return false; // Indicate failure if the input field wasn't found
  };

  // This observer looks for changes in the DOM that indicate the modal has been added
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        // Check if the modal is now present
        const modalExists = Array.from(mutation.addedNodes).some(
          (node) => node.matches && node.matches(".MuiDrawer-root")
        );
        if (modalExists && trySetInputValue()) {
          observer.disconnect(); // Disconnect the observer if successful
          break; // Exit the loop
        }
      }
    }
  });

  // Start observing the body for when elements are added to the DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Try to set the input value immediately in case the modal is already visible
  if (!trySetInputValue()) {
    console.log("Waiting for the modal to appear...");
  }
}

function observeTableAndFindRow(nameOnPortfolio) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          // Check if the added node is a table row
          if (node.role === "row") {
            // Find the span containing the portfolio name
            const spans = node.querySelectorAll("span");
            spans.forEach((span) => {
              if (span.textContent.trim() === nameOnPortfolio) {
                console.log("Found row with portfolio name:", nameOnPortfolio);
                // Find and click the radio button
                const radioButton = node.querySelector('button[role="radio"]');
                if (radioButton) {
                  radioButton.click();
                  console.log("Clicked the radio button for", nameOnPortfolio);
                  setTimeout(() => {
                    clickSelectProductButton();
                  }, 5000);
                }
              }
            });
          }
        });
      }
    });
  });

  // Start observing the body for added elements
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log("Observer has been set up. Waiting for the row to appear...");
}

function saveContinue() {
  let spanFound = false;
  let spans = document.querySelectorAll("span");

  for (let span of spans) {
    if (span.textContent.includes("Save and continue")) {
      console.log(`SPAN FOUND WITH STRING "SAVE AND CONTINUE"`, span);
      spanFound = true;

      setTimeout(() => {
        span.click(); // Simpler way to click without creating a MouseEvent
        console.log("Clicked 'Save and continue'");
      }, 2000); // Waiting for animations to complete

      break; // Exit the loop as we've found and clicked the span
    }
  }
}

function clickSelectProductButton() {
  // Query for the button based on class name and content
  const buttons = Array.from(document.querySelectorAll("button"));
  const selectProductButton = buttons.find((button) => {
    return button.textContent.includes("Select product");
  });

  // Check if the button exists and is not disabled
  if (selectProductButton && !selectProductButton.disabled) {
    selectProductButton.click();
    console.log('Clicked the "Select product" button.');
    setTimeout(() => {
      saveContinue();
      setTimeout(() => {
        saveContinue();
        setTimeout(() => {
          clickFeeScheduleDropdownAndSelectOption();
        }, 11000);
      }, 5000);
    }, 3000);
  } else {
    console.log("Button not found or it is disabled.");
  }
}

function clickFeeScheduleDropdownAndSelectOption() {
  // First, click the dropdown to reveal the options
  const dropdown = document.querySelector(".MuiSelect-selectMenu");
  if (dropdown) {
    dropdown.focus();
    ["mousedown", "mouseup", "click"].forEach((eventType) => {
      dropdown.dispatchEvent(
        new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
    });
    // Wait for the options to appear
    setTimeout(() => {
      // Look for the options in the list
      const optionText = feeSchedule === "quarterly" ? "Quarterly" : "Monthly";
      const listItems = document.querySelectorAll(
        "ul.MuiList-root li.MuiMenuItem-root"
      );

      // Find the specific option
      const optionToSelect = Array.from(listItems).find((item) => {
        return item.innerText.includes(optionText);
      });

      if (optionToSelect) {
        optionToSelect.click();
        console.log(`Option "${optionText}" has been clicked.`);
        setTimeout(() => {
          clickEditAdvisorFeeButton();
        }, 8000);
      } else {
        console.log(`Option "${optionText}" not found.`);
      }
    }, 500); // Adjust this timeout to match the time it takes for the options to appear
  } else {
    console.log("Dropdown for fee schedule not found.");
  }
}

function clickEditAdvisorFeeButton() {
  // Query the document for the button with the specific aria-label
  const button = document.querySelector(
    'button[aria-label="edit-advisor-fee"]'
  );

  // Check if the button exists
  if (button) {
    button.click(); // Click the button
    console.log('Clicked the "edit-advisor-fee" button.');
    setTimeout(() => {
      setupModalObserverAndClickDropdown();
      setTimeout(() => {
        clickDropdownMenu();
      }, 5000);
    }, 5000);
  }
}

function setupModalObserverAndClickDropdown() {
  // Define the observer
  const observer = new MutationObserver((mutations, obs) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        // Check for the specific modal class
        const modalExists = Array.from(mutation.addedNodes).some(
          (node) => node.matches && node.matches(".MuiDialog-scrollPaper")
        );

        if (modalExists) {
          console.log("Modal detected, clicking dropdown...");
          setTimeout(() => {
            clickDropdownMenu();
          }, 5000);
          obs.disconnect(); // Disconnect the observer after clicking the dropdown
          break;
        }
      }
    }
  });

  // Start observing the document body for added nodes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function clickDropdownMenu() {
  // Select all dropdowns
  const dropdowns = document.querySelectorAll(
    "div.MuiSelect-root[aria-haspopup='listbox']"
  );

  // Find the dropdown that contains the specific span text
  const targetDropdown = Array.from(dropdowns).find((dropdown) => {
    const span = dropdown.querySelector("span");
    return span && span.textContent === "Select a fee template";
  });

  if (targetDropdown) {
    targetDropdown.focus();
    ["mousedown", "mouseup", "click"].forEach((eventType) => {
      targetDropdown.dispatchEvent(
        new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      );
    });
    console.log("Dropdown with 'Select a fee template' clicked.");
    setTimeout(() => {
      clickFeeTemplateOption(feeTemplate);
    }, 5000);
  } else {
    console.log("Specific dropdown not found.");
  }
}

function clickFeeTemplateOption(feeTemplate) {
  // Wait for the dropdown to be opened and rendered in the DOM
  const interval = setInterval(() => {
    const options = document.querySelectorAll(
      ".MuiMenu-paper .MuiMenuItem-root"
    );
    if (options.length > 0) {
      clearInterval(interval);

      // Find the option that includes the fee template text
      const targetOption = Array.from(options).find((option) =>
        option.textContent.includes(feeTemplate)
      );

      if (targetOption) {
        targetOption.click();
        console.log(`Clicked fee template option: ${feeTemplate}`);
        setTimeout(() => {
          clickApplyButton(feeTemplate);
        }, 1000);
      } else {
        console.log(`Fee template option '${feeTemplate}' not found.`);
      }
    }
  }, 500); // Check every 500 milliseconds
}
function clickApplyButton() {
  // Select all buttons
  const buttons = document.querySelectorAll('button[type="button"]');

  // Find the button with the text "Apply"
  const targetButton = Array.from(buttons).find((button) =>
    button.textContent.includes("Apply")
  );

  if (targetButton) {
    targetButton.click();
    console.log("Clicked 'Apply' button.");
    setTimeout(() => {
      clickAgreeButton();
    }, 5000);
  } else {
    console.log("'Apply' button not found.");
  }
}

function clickAgreeButton() {
  // Find the span containing the specific text
  const span = Array.from(document.querySelectorAll("span")).find((span) =>
    span.textContent.includes("I agree to the fee schedules shown above")
  );

  if (span) {
    // Find the button within the parent of the span
    const button = span.parentElement.querySelector('button[role="checkbox"]');
    if (button) {
      button.click();
      console.log("Clicked 'I agree' checkbox button.");
      setTimeout(() => {
        clickContinueButton();
      }, 5000);
    } else {
      console.log("'I agree' checkbox button not found.");
    }
  } else {
    console.log("Span with 'I agree' text not found.");
  }
}

function clickContinueButton() {
  // Find the span containing the specific text "Continue"
  const span = Array.from(document.querySelectorAll("button span")).find(
    (span) => span.textContent.includes("Continue")
  );

  if (span) {
    // Get the button that is the ancestor of the span
    const button = span.closest("button");
    if (button) {
      if (!button.disabled) {
        button.click();
        console.log("Clicked 'Continue' button.");
      } else {
        console.log("'Continue' button is disabled.");
      }
    } else {
      console.log("'Continue' button not found.");
    }
  } else {
    console.log("Span with 'Continue' text not found.");
  }
}
