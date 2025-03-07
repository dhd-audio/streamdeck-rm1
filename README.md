# RM1 Control Plugin for Stream Deck

A Stream Deck Plugin to control RM1 by DHD audio. It uses DHD's control API via WebSocket.

It also serves as a code sample for developers interested in implementing DHD's control API.

## Supported Actions

Supported actions are:
* Channel On/Off
* PFL On/Off
* HP1/HP2/Out volume on encoder (SD+)
* Fader level on encoder (SD+)

## Get started

- Install the plugin.
- Configure any action and click the 'Configure RM1 Connection'.
- Enter the RM1 hostname or IP address and click save. The values are globally stored for each action.

## How it works

The plugin operates as a single instance, meaning that all actions on the Stream Deck send events to this one instance of the DHD plugin.

![stream deck architecture](./assets/stream-deck.svg)

When the plugin is created (the `onAppear` event is emitted), an action instance is created for each action context. This ensures that every action has its own unique instance linked to the plugin.

The Event Broker subscribes to events like `keyUp` or `didReceiveSettings`, allowing it to manage and handle incoming events related to specific actions.

When a `keyUp` event is emitted, the event's context ID is used to identify the corresponding action instance. The `onKeyUp` function of that action instance is then called.

The `onKeyUp` function communicates with the DHD Device via the control API. A `set` message is sent to the DHD Device, for example:

```json
{
  "msgID": 1,
  "method": "set",
  "path": "/audio/mixers/0/faders/5/on",
  "payload": true
}
```

The control API sends back a response, which is handled by the `websocket.onmessage` function, ensuring the correct processing of the API's feedback.

When an action instance is created, the `onWillAppear` function is called. This function subscribes the action instance to a specific control API `path`. The `path` is included in the response message of the `set` message, for example:

```json
{
  "msgID": 1,
  "method": "set",
  "path": "/audio/mixers/0/faders/5/on",
  "payload": true,
  "success": true
}
```

This allows the action instance to be properly linked to the API and receive updates.


## DHD Control API

Control API documentation is available at the [DHD developer portal](https://developer.dhd.audio/). RM1 documentation is available at [docs.rm1.audio](https://docs.rm1.audio).

Also, have a look at the more generic [DHD Stream Deck plugin](https://github.com/dhd-audio/streamdeck-DHD).

## Contributing

Follow the documentation of the [Stream Deck SDK](https://docs.elgato.com/sdk/) to get started developing the plugin. Then clone the repository to your machine and install the required streamdeck library submodule using `git submodule update --init --recursive`.

If you have added new features or fixed bugs, feel free to create a pull request.

## License

Copyright (c) 2025 DHD audio GmbH. Licensed under the MIT License. See LICENSE for the full licensing terms.