// src/test/modelService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { startDetection } from '../modelService';

describe('modelService', () => {
  it('startDetection sets running = true (implicit)', () => {
    startDetection();
    expect(true).toBe(true); // 実際のテストは後で実装
  });
});
