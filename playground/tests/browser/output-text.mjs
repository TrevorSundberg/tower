// Output DOM is virtualized. Assert/copy the CodeMirror document, not just the
// rendered viewport. Keep this test-only CodeMirror DOM bridge in one place.
export async function outputText(page, id) {
  return page.locator('#'+id).evaluate(element =>
    element.querySelector('.cm-content')?.cmView?.rootView?.view.state.doc.toString() ?? '');
}
