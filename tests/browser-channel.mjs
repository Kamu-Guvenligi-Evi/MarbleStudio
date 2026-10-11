// Existing flow tests select a channel just as a user does. Branding behavior
// and cancellation are tested separately in channel-branding-browser.mjs.
export async function selectTestChannel(page) {
  await page.addInitScript(() => {
    const observer = new MutationObserver(() => {
      const dialog = document.querySelector('#channel-choice[open]');
      if (!dialog) return;
      const select = dialog.querySelector('select');
      select.value = 'LastBallStand';
      dialog.querySelector('form').requestSubmit();
    });
    observer.observe(document, {childList:true, subtree:true, attributes:true, attributeFilter:['open']});
  });
}
