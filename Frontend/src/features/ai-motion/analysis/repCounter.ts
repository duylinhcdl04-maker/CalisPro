import type { RepPhase, RepCounterState, CalculatedMotionMetrics } from '../mediapipe/poseTypes';

export class RepCounter {
  private state: RepCounterState = {
    repCount: 0,
    currentPhase: 'START',
    currentRom: 0,
    peakRom: 0,
    invalidRepCount: 0,
    lastRepDurationMs: 0,
    lastRepScore: 100,
    repStartTime: null,
  };

  private minRomThreshold = 80;
  private minRepDurationMs = 800;
  private lastRepCompleteTime = 0;
  private debounceMs = 400;

  constructor(options?: { minRomThreshold?: number; minRepDurationMs?: number; debounceMs?: number }) {
    if (options?.minRomThreshold) this.minRomThreshold = options.minRomThreshold;
    if (options?.minRepDurationMs) this.minRepDurationMs = options.minRepDurationMs;
    if (options?.debounceMs) this.debounceMs = options.debounceMs;
  }

  public update(metrics: CalculatedMotionMetrics, timestampMs: number): {
    state: RepCounterState;
    repCompletedJustNow: boolean;
    repIsValid: boolean;
  } {
    const rom = metrics.depthRomPercentage;
    this.state.currentRom = rom;
    let repCompletedJustNow = false;
    let repIsValid = true;

    switch (this.state.currentPhase) {
      case 'START':
        if (rom > 15) {
          this.state.currentPhase = 'DESCENDING';
          this.state.repStartTime = timestampMs;
          this.state.peakRom = rom;
        }
        break;

      case 'DESCENDING':
        if (rom > this.state.peakRom) {
          this.state.peakRom = rom;
        }
        // Reached bottom / inflection point
        if (rom >= this.minRomThreshold || (this.state.peakRom > 60 && rom < this.state.peakRom - 5)) {
          this.state.currentPhase = 'INFLECTION';
        } else if (rom < 10 && timestampMs - (this.state.repStartTime || timestampMs) > 300) {
          // Aborted before reaching depth
          this.state.currentPhase = 'START';
          this.state.peakRom = 0;
          this.state.repStartTime = null;
        }
        break;

      case 'INFLECTION':
        if (rom > this.state.peakRom) {
          this.state.peakRom = rom;
        }
        // Started pushing back up
        if (rom < this.state.peakRom - 8) {
          this.state.currentPhase = 'ASCENDING';
        }
        break;

      case 'ASCENDING':
        // Finished return to starting lockout
        if (rom <= 15) {
          const duration = this.state.repStartTime ? timestampMs - this.state.repStartTime : 1000;
          const timeSinceLastRep = timestampMs - this.lastRepCompleteTime;

          if (duration >= this.minRepDurationMs && timeSinceLastRep >= this.debounceMs) {
            repCompletedJustNow = true;
            this.state.lastRepDurationMs = duration;
            this.lastRepCompleteTime = timestampMs;

            // Check if rep reached full ROM
            if (this.state.peakRom >= this.minRomThreshold) {
              this.state.repCount += 1;
              this.state.lastRepScore = Math.min(100, Math.round(this.state.peakRom));
              repIsValid = true;
            } else {
              this.state.invalidRepCount += 1;
              this.state.lastRepScore = Math.round(this.state.peakRom);
              repIsValid = false;
            }
          }

          this.state.currentPhase = 'COMPLETED';
        }
        break;

      case 'COMPLETED':
        if (rom <= 10) {
          this.state.currentPhase = 'START';
          this.state.peakRom = 0;
          this.state.repStartTime = null;
        } else if (rom > 20) {
          this.state.currentPhase = 'DESCENDING';
          this.state.repStartTime = timestampMs;
          this.state.peakRom = rom;
        }
        break;
    }

    return {
      state: { ...this.state },
      repCompletedJustNow,
      repIsValid,
    };
  }

  public reset(): void {
    this.state = {
      repCount: 0,
      currentPhase: 'START',
      currentRom: 0,
      peakRom: 0,
      invalidRepCount: 0,
      lastRepDurationMs: 0,
      lastRepScore: 100,
      repStartTime: null,
    };
    this.lastRepCompleteTime = 0;
  }

  public getState(): RepCounterState {
    return { ...this.state };
  }
}
