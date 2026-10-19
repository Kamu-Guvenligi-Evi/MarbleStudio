// Explicit populated fixture; the actual game opens with empty armies.
export async function populateClassic(page) {
  await page.locator('#menu-setup').click();
  for (const side of ['north', 'red']) for (const [type, count] of Object.entries({ sword:64, pike:48, archer:32, cavalry:16 })) {
    await page.locator(`#${side}-${type}`).fill(String(count));
  }
  await page.locator('#apply').click();
  await page.locator('#menu-command').click();
}
