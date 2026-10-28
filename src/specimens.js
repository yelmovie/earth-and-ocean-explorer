import { illustration, specimenLabels } from './illustrations.js';

export function specimen(id) {
  const label = specimenLabels[id];
  if (!label) return '';
  return `<img class="specimen-image specimen-${id}" src="${illustration(id)}" alt="${label}" decoding="async">`;
}
