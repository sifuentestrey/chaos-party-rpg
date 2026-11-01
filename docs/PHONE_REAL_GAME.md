# Testing the real game from a phone

GitHub Pages can only serve the static solo build. It cannot run the live
Colyseus/WebSocket server. The repository now includes a GitHub Codespaces
configuration for running the actual server without a Mac.

1. In GitHub, open the repository, choose **Code → Codespaces**, and create a
   codespace from `improve/tavern-presentation`.
2. Wait for the setup to finish. The codespace installs dependencies and starts
   the real server on port `4747` automatically.
3. Open the **Ports** panel, open port `4747`, then visit `/host` on the
   forwarded address.
4. Create a room on the host screen. The QR code now uses the forwarded
   address, so phones can join the same live room.

The port is private by default. That keeps the room behind GitHub sign-in. For
a short family test, the port can be changed to **Public** in the Ports panel;
anyone with the temporary URL could then reach the room, so stop the codespace
when the test ends. GitHub Codespaces may use an account’s included quota or
billable minutes; do not start one unless that is acceptable.

This runs the real host, controller, Colyseus transport, character creation,
room rules, and reconnect behavior. Campaign files live inside the codespace
for the session and are not a replacement for the Mac’s durable campaign
storage.
