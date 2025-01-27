/**
 * DOM操作に関するユーティリティ関数を提供するモジュール
 */

/**
 * 指定されたIDを持つDOM要素を取得する
 * @template T - 取得する要素の型（HTMLElementを継承）
 * @param {string} id - 取得する要素のID
 * @returns {T | null} 指定されたIDを持つ要素、存在しない場合はnull
 */
export function getElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}
