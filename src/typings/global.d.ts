// src/typings/global.d.ts
import { HandDetector } from '@tensorflow-models/hand-pose-detection';

declare global {
  interface Window {
    detector: HandDetector;
  }
}
