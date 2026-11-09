/**
 * Utility to dynamically update document title and OpenGraph (Zalo / Facebook) metadata tags.
 */
export function updateDynamicMetadata(title: string, description: string, image?: string) {
  if (typeof document === 'undefined') return;

  const fullTitle = `${title} - Thầy Phạm Nhật Toàn • THCS Ngô Quyền`;
  document.title = fullTitle;

  // Meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', description);
  }

  // OpenGraph title
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', fullTitle);
  }

  // OpenGraph description
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) {
    ogDesc.setAttribute('content', description);
  }

  // OpenGraph image
  if (image) {
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) {
      ogImg.setAttribute('content', image);
    }
  }

  // Twitter title & description
  const twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle) {
    twTitle.setAttribute('content', fullTitle);
  }

  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) {
    twDesc.setAttribute('content', description);
  }
}
