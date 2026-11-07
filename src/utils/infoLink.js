// The About and Contact section lives at the bottom of Home and Inventory.
// On those pages the link scrolls down. From any other page it goes to Home.
const INFO_PAGES = ['/', '/inventory'];

export const infoTarget = (currentPath, hash) => ({
  pathname: INFO_PAGES.includes(currentPath) ? currentPath : '/',
  hash,
});