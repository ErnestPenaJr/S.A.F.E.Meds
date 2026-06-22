/** Build an app route from a page name: "Add Medication" -> "/add-medication". */
export function createPageUrl(pageName) {
  return '/' + pageName.toLowerCase().replace(/ /g, '-');
}
