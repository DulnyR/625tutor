export async function findTextInPDF(pdf, searchText, endTextOptions, startRange = 2) {
  let startPage = null;
  let endPage = null;
  const normalize = (text) => (typeof text === 'string' ? text.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ').trim() : '');
  const normalizedSearch = normalize(searchText);
  const normalizedEndTexts = Array.isArray(endTextOptions)
    ? endTextOptions.map(option => normalize(option))
    : [normalize(endTextOptions)];

  for (let pageNumber = startRange; pageNumber <= pdf.numPages; pageNumber++) {
    console.log(`[EXAMQUESTION] Searching page ${pageNumber} for text: "${normalizedSearch}"`);
    try {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      const normalizedPageText = normalize(pageText);

      if (!(normalizedPageText.includes('written examination marking scheme'))) {
        if (startPage === null && normalizedPageText.includes(normalizedSearch)) {
          startPage = pageNumber;
        } else if (startPage !== null && endPage === null) {
          for (const endText of normalizedEndTexts) {
            if (normalizedPageText.includes(endText)) {
              endPage = pageNumber;
              break;
            }
          }
        }
      }
      if (startPage !== null && endPage !== null) break;
    } catch (pageError) {
      console.error(`Error loading page ${pageNumber}:`, pageError);
    }
  }
  return { startPage, endPage };
}