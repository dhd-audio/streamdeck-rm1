/// <reference path="../../libs/js/property-inspector.js" />
/// <reference path="../../libs/js/utils.js" />
/// <reference path="../../libs/js/action.js" />

console.log("Loaded", $PI);

let settings = {
  keyFunction: "0"
};
let globalSettings = {
  ipAddress: ""
};

$PI.onConnected((jsn) => {
  settings = jsn.actionInfo.payload.settings;
  console.log("connected", settings);

  let actionUUID = $PI.actionInfo.action;
  // register a callback for the 'sendToPropertyInspector' event
  $PI.onSendToPropertyInspector(actionUUID, (jsn) => {
    console.log("onSendToPropertyInspector", jsn);
    sdpiCreateList(document.querySelector("#runningAppsContainer"), {
      id: "runningAppsID",
      label: "Running Apps",
      value: jsn.payload.runningApps,
      type: "list",
      selectionType: "no-select",
    });
  });

  $PI.getGlobalSettings();
});

const channelSelect = document.querySelector("#keyfunction");
channelSelect.addEventListener("change", (event) => {
  const selectedValue = event.target.value;
  console.log("Selected key function:", selectedValue);

  $PI.setSettings({
    keyFunction: selectedValue,
  });
  settings.keyFunction = selectedValue;
});

/**
 * @param {HTMLSelectElement} htmlSelectEl
 */
const clearChannelSelect = (htmlSelectEl) => {
  console.debug("clear channel select");
  htmlSelectEl.innerHTML = "";
}

/**
 * Add the "Channel" select options by query the fader list from RM1
 *
 * @param {String} ip
 * @param {Number} keyFunction
 * @param {HTMLSelectElement} htmlSelectEl
 */
const buildChannelSelectOptions = (ip, keyFunction, htmlSelectEl)=> {
  const url = `http://${ip}/api/rest/audio/mixers/0/faders`;
  console.debug("fetch faders from", url);

  /**
   * @param {Object} faders - A list of all faders currently processed within the virtual mixer.
   *                          https://developer.dhd.audio/docs/API/control-api/oapi#tag/audiomixersfaders/paths/~1audio~1mixers~1%7BmixerID%7D~1faders/get
   */
  const parseIntoOptions = (faders) => {
    console.debug("fetch faders from rm1", faders);

    Object.entries(faders)
      .filter(([_, x]) => x.sourceid !== 0)
      .forEach(([id, x], idx)=> {
        const option = document.createElement("option");
        option.value = id;
        option.text = x.label;

        const isFallbackSelectFirst = keyFunction === undefined && idx === 0;
        if (id === keyFunction || isFallbackSelectFirst) {
          option.selected = true;

          $PI.setSettings({
            keyFunction: id,
          });
          settings.keyFunction = id;
        }

        htmlSelectEl.add(option);
      });
  };

  fetch(url)
    .then(resp => {
      document.querySelector("#errorMessage").style.display = "none";
      return resp.json();
    })
    .then(parseIntoOptions)
    .catch(e => {
      document.querySelector("#errorMessage").style.display = "block";
      console.error(e)
    })
}

$PI.onDidReceiveGlobalSettings((jsn) => {
  globalSettings = jsn.payload.settings;
  
  console.log("Global settings received", globalSettings);

  if (globalSettings.ipAddress){
    buildChannelSelectOptions(globalSettings.ipAddress, settings.keyFunction, channelSelect);
  }
});

// Open the external window
document.querySelector("#open-external").addEventListener("click", () => {
  const modal = window.open("../../external.html", "DHD Settings");
  modal.onload = () => {
    console.log(
      "Sending IP address to external window:",
      globalSettings.ipAddress,
    );

    modal.postMessage(
      globalSettings,
      "*",
    );
  };
});

// Listen for messages from the external window
window.addEventListener("message", (event) => {
  if (event.data?.ipAddress) {
    console.log(
      "Received IP address from external window:",
      event.data.ipAddress,
    );

    // Save the IP address using Stream Deck's setSettings method
    globalSettings = {
      ipAddress: event.data.ipAddress,
    };

    $PI.setGlobalSettings(globalSettings);

    clearChannelSelect(channelSelect);
    buildChannelSelectOptions(globalSettings.ipAddress, settings.keyFunction, channelSelect);
  }
});
