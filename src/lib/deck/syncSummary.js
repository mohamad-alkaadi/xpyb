/**
 * Describes the outcome of a notebook sync.
 * @param {{changedIds: string[], added: number, missing: number}} summary Sync summary.
 * @returns {string} Message for the user.
 */
export const describeSync = ({ changedIds, added, missing }) => {
  const parts = [`${changedIds.length} updated`, `${added} added`];
  if (missing > 0) parts.push(`${missing} no longer in the notebook (kept)`);
  return `Synced: ${parts.join(', ')}.`;
};
