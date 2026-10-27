// Host dialogs capture a snapshot when opened; reopen if the UI is behind the server.
export async function skipBrowserTimer(host,currentRoom){
  const timed=()=>['react','reveal'].includes(currentRoom().phase);
  const end=Date.now()+4000;
  while(timed()){
    if(Date.now()>end)throw Error('Host timer control did not catch up with the active phase.');
    await host.locator('[data-action=settings]').click();
    const button=host.locator('[data-host=resolve]');
    if(timed()&&await button.isEnabled()){
      await button.click();
      return;
    }
    await host.locator('dialog[open] [data-close]').click();
    await host.waitForTimeout(30);
  }
}
