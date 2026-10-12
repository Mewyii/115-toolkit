import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import type { BeschlussInfos } from '../fitko-website.component';

export interface ZuordnungDialogData {
  getTotalCount: () => number;
  getProcessedCount: () => number;
  isRunning: () => boolean;
  isStopRequested: () => boolean;
  getCurrentBeschluss: () => BeschlussInfos | undefined;
  getErrorCount: () => number;
  getLastError: () => string;
  start: () => void;
  stop: () => void;
}

@Component({
  selector: 'app-zuordnung-dialog',
  templateUrl: './zuordnung-dialog.component.html',
  styleUrls: ['./zuordnung-dialog.component.scss'],
  standalone: false,
})
export class ZuordnungDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ZuordnungDialogData) {}

  get totalCount() {
    return this.data.getTotalCount();
  }

  get processedCount() {
    return this.data.getProcessedCount();
  }

  get isRunning() {
    return this.data.isRunning();
  }

  get isStopRequested() {
    return this.data.isStopRequested();
  }

  get currentBeschluss() {
    return this.data.getCurrentBeschluss();
  }

  get errorCount() {
    return this.data.getErrorCount();
  }

  get lastError() {
    return this.data.getLastError();
  }

  get allProcessed() {
    return this.totalCount > 0 && this.processedCount >= this.totalCount;
  }

  get progress() {
    return this.totalCount > 0 ? (this.processedCount / this.totalCount) * 100 : 0;
  }
}
