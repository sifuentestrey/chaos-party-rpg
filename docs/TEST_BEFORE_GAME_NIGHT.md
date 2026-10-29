> Bundled Node 22.16.0 Intel/ARM executables declare minimum macOS 11.0 (verified from their Mach-O load commands). Confirm the 2015 Mac runs Big Sur 11 or newer before rehearsal; the launcher now explains this requirement. No OS update or installation change is performed by the game.

# Test before game night

This beta is intended for a small, local game night. The shared game appears on one TV or computer screen; each player uses a phone as a remote.

## Protect existing campaign data

The app stores campaign data at:

`~/Library/Application Support/Chaos Party/campaigns.json`

Stop any running copy, then back up this file before trying a new build. Keep the old installation and its launcher untouched while evaluating the new build. Do not overwrite the old installation. If another copy is still running, the launcher may reopen that older server instead of starting the candidate you intended to test.

Use a new test room rather than resuming the family's existing campaign. Check `release-info.json` for the source version and build date; packaging metadata does not mean the Mac or AI has passed acceptance.

## Suggested check

1. Start the new build and host a private room on the same Wi-Fi network as the phones.
2. Join with two phones and play the opening tavern sequence for 90 seconds. Try the available objects and actions, and check that the TV scene responds.
3. Give the two characters distinct appearances and confirm they remain distinct on screen.
4. Save the campaign, restart the game, and confirm the campaign and characters can be rejoined.
5. If that works, add a larger group and check joining, controller responsiveness, and reconnect behavior.
6. Try an invalid action that requests fake coins or another invented reward; confirm it does not create a reward the game does not support.
7. Repeat the basic flow with internet access disabled. The baseline game should work offline and does not require an API key.

Narration remains off by default. Free AI narration is optional and has not been qualified for this game night; the game is playable without it.

## Recovery note

The original `Chaos_Party_Mac.zip` was not present in the recovery workspace, so this package cannot claim to be a verified replacement for that original archive. Physical Mac and phone checks are still required before treating this build as accepted.

The [current readiness checklist](https://github.com/sifuentestrey/chaos-party-rpg/blob/fix/grounded-action-contract/docs/CURRENT_STATUS.md) distinguishes current status from older reports included with the project.
