/// <reference path="../../libs/js/property-inspector.js" />
/// <reference path="../../libs/js/utils.js" />
/// <reference path="../../libs/js/action.js" />

console.log("Loaded", $PI);

let settings = {
  presetId: "0",
};
let globalSettings = {
  ipAddress: "",
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

const presetSelect = document.querySelector("#preset");
presetSelect.addEventListener("change", (event) => {
  const selectedValue = event.target.value;
  console.log("Selected preset:", selectedValue);

  $PI.setSettings({
    presetId: selectedValue,
  });
  settings.presetId = selectedValue;
});

/**
 * @param {HTMLSelectElement} htmlSelectEl
 */
const clearSelect = (htmlSelectEl) => {
  console.debug("clear select element");
  htmlSelectEl.innerHTML = "";
};

/**
 * Add the "Preset" select options by query the fader list from RM1
 *
 * @param {String} ip
 * @param {Number} presetId - the currently selected preset id
 * @param {HTMLSelectElement} htmlSelectEl
 * @param {type} number - The type of preset defined at https://developer.dhd.audio/docs/api/control-api/rpc/#snapshots
 */
const buildPresetSelectOptions = (ip, presetId, htmlSelectEl, type) => {
  const url = `http://${ip}/api/rest/`;
  console.debug("fetch presets from", url);

  /**
   * @param {Object} preset - A list of all preset
   */
  const parseIntoOptions = (preset) => {
    console.debug("fetch preset from rm1", preset);

    preset.payload.result.forEach(({ id, name }, idx) => {
      const option = document.createElement("option");
      option.value = id;
      option.text = name;

      const isFallbackSelectFirst = presetId === undefined && idx === 0;
      if (id === presetId || isFallbackSelectFirst) {
        option.selected = true;

        $PI.setSettings({
          presetId: id,
        });
        settings.presetId = id;
      }

      htmlSelectEl.add(option);
    });
  };

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      method: "rpc",
      payload: {
        method: "getsnapshotlist",
        params: {
          type,
        },
      },
    }),
  })
    .then((resp) => {
      document.querySelector("#errorMessage").style.display = "none";
      return resp.json();
    })
    .then(parseIntoOptions)
    .catch((e) => {
      document.querySelector("#errorMessage").style.display = "block";
      console.error(e);
    });
};

$PI.onDidReceiveGlobalSettings((jsn) => {
  globalSettings = jsn.payload.settings;

  console.log("Global settings received", globalSettings);

  if (globalSettings.ipAddress) {
    buildPresetSelectOptions(
      globalSettings.ipAddress,
      settings.presetId,
      presetSelect,
      2,
    );
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

    modal.postMessage(globalSettings, "*");
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

    clearSelect(presetSelect);
    buildPresetSelectOptions(
      globalSettings.ipAddress,
      settings.presetId,
      presetSelect,
      1,
    );
  }
});
