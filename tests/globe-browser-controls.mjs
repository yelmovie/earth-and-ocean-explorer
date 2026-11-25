// Turn the globe with the same keyboard input a learner uses to expose hidden pins.
import assert from 'node:assert/strict';

export async function revealGlobePin(page, id) {
  const globe = page.locator('#globe');
  const pin = page.locator(`.earth-pin[data-value="${id}"]`);
  for (let turn = 0; turn < 19 && !(await pin.isVisible()); turn++) {
    await globe.press('ArrowRight');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  }
  assert.equal(await pin.isVisible(), true, `${id} should be reachable by rotating the globe`);
  return pin;
}
