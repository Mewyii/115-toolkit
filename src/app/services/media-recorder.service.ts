import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MediaRecorderService {
  public mediaRecorder: MediaRecorder | undefined;

  private audioFileSubject = new Subject<Blob>();
  public audioFile$ = this.audioFileSubject.asObservable();

  constructor() {}

  startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      this.mediaRecorder = new MediaRecorder(stream);
      // This is losing "this"-Context. Absolutely stupid.
      // this.mediaRecorder.ondataavailable = (e) => this.onRecordingStopped(e);
      this.mediaRecorder.addEventListener('dataavailable', (e: any) => {
        this.onRecordingStopped(e);
      });
      this.mediaRecorder.start();
    });
  }

  stopRecording() {
    this.mediaRecorder?.stop();
  }

  private async onRecordingStopped(event: BlobEvent) {
    const audioChunks: Blob[] = [];
    audioChunks.push(event.data);

    if (this.mediaRecorder?.state == 'inactive') {
      const blob = new Blob(audioChunks, { type: 'audio/mpeg-3' });

      this.audioFileSubject.next(blob);
    }
  }
}
