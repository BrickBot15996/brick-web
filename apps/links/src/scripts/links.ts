/** Hides links outside their start/end dates, so a link expires on its end date without waiting for a rebuild. */
const today = new Date().toISOString().slice(0, 10);
document.querySelectorAll<HTMLElement>('[data-start], [data-end]').forEach((el) => {
  const { start, end } = el.dataset;
  if ((start && today < start) || (end && today > end)) el.hidden = true;
});
