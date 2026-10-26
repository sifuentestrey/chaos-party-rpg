# Phone preview

The repository has a static solo preview workflow for visual phone-first review.
It publishes the built `dist/` directory through GitHub Pages whenever `main`
or `improve/tavern-presentation` changes. This preview contains the scripted
solo heist and the current tavern presentation. It does not expose the
multiplayer server, host key, campaign saves, or phone-to-phone transport.

The repository owner must enable GitHub Pages once in the repository settings,
choosing **GitHub Actions** as the source. GitHub may require Pages to be
available for the repository’s plan. The preview URL will normally be:

`https://sifuentestrey.github.io/chaos-party-rpg/`

After that one-time setting, push a change and wait for the **Phone preview**
workflow to finish. Open the URL from a phone, tap **Enter the tavern**, and
play the solo sequence. Refreshing the page starts from the saved solo state in
that browser. Because the build is static, it can be used while away from the
Mac and is safe to review from a phone.

If the URL returns 404, open the repository’s **Actions** tab and run **Phone
preview** manually on `improve/tavern-presentation`. The first run made before
Pages was enabled cannot publish retroactively; a fresh run is required.

For the full family game, use the Mac LAN workflow described in
[TAVERN_PRESENTATION.md](TAVERN_PRESENTATION.md). The Pages preview is not the
real multiplayer game. For actual host/controller gameplay from phones, use
[PHONE_REAL_GAME.md](PHONE_REAL_GAME.md) with a Codespace, or run the Mac LAN
workflow.
