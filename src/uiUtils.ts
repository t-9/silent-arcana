/**
 * UIの操作に関するユーティリティ関数を提供するモジュール
 */

/**
 * ローディング要素のテキストを設定し、ローディング状態を制御する
 * @param {HTMLElement} loadingEl - テキストを設定するローディング要素
 * @param {string} text - 設定するテキスト。空文字列の場合、ローディング状態が解除される
 */
export function setLoadingText(loadingEl: HTMLElement, text: string): void {
  loadingEl.textContent = text;
  loadingEl.setAttribute('data-text', text);
  if (text) {
    loadingEl.classList.add('loading');
  } else {
    loadingEl.classList.remove('loading');
  }
}
