export function setLoadingText(loadingEl: HTMLElement, text: string): void {
  loadingEl.textContent = text;
  loadingEl.setAttribute('data-text', text);
  if (text) {
    loadingEl.classList.add('loading');
  } else {
    loadingEl.classList.remove('loading');
  }
}
