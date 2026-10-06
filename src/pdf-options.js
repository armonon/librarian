export function pdfOptions(data, baseURI = document.baseURI) {
  const resource = name => new URL(`pdfjs/${name}/`, baseURI).href;
  return { data, isEvalSupported: false, enableScripting: false, enableXfa: false,
    cMapUrl: resource('cmaps'), cMapPacked: true,
    standardFontDataUrl: resource('standard_fonts'), wasmUrl: resource('wasm') };
}
