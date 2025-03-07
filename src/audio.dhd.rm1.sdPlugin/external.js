// Listen for messages from the main window
window.addEventListener("message", (event) => {
  if (event.data && event.data.ipAddress) {
    console.log("Received IP address from main window:", event.data.ipAddress);
    document.querySelector("#ipAddress").value = event.data.ipAddress;
  }
});

document.querySelector("#send").addEventListener("click", () => {
  const ipAddress = document.querySelector("#ipAddress").value;
  console.log("ipAddress:", ipAddress);

  // Send the IP address back to the main window
  if (window.opener) {
    window.opener.postMessage({ ipAddress }, "*");
  }
});
