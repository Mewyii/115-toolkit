import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';

export type ChatbotDialogType = 'system_greeting' | 'find_leistung' | 'keine_leistung_gefunden' | '"question_answering"';

export interface ChatbotLeistung {
  id: number;
  titel: string;
  url: string;
}

export interface ChatbotDialog {
  user_message?: string;
  system_response?: string;
  message_type?: ChatbotDialogType;
  leistung?: ChatbotLeistung;
}

export interface ChatbotSession {
  messages: ChatbotDialog[];
}

export interface ChatbotSessionAPIPost extends ChatbotSession {
  user_message: string;
  parameters: ChatbotAPIPostParameters;
}

export interface ChatbotAPIPostParameters {
  llm: string;
  embedding_model: string;
  language: 'en' | 'de';
  skip_cache: boolean;
}

export interface ChatbotAPIPostResponse {
  best_matches?: any;
  leistung?: ChatbotLeistung;
  messages: ChatbotDialog[];
  state: string;
  error?: any;
}

@Component({
  selector: 'app-zukunftstechnologie-bot',
  templateUrl: './zukunftstechnologie-bot.component.html',
  styleUrls: ['./zukunftstechnologie-bot.component.scss'],
})
export class ZukunftstechnologieBotComponent implements OnInit {
  @ViewChild('messageHistory') private messageHistoryElement!: ElementRef<HTMLElement>;
  @ViewChildren('messageElements') messageElements!: QueryList<any>;

  public userGreetings: string[] = [
    '<b>Hallo!</b> Ich bin der Chatbot der Behördennummer 115 für den Landkreis Harburg. Wie kann ich Ihnen helfen?',
    'Aktuell befinde ich mich in einer Testphase und freue mich, wenn Sie meine Feedbackmöglichkeiten nutzen.',
    '<b>Bitte nennen Sie mir Ihr Anliegen inkl. des Ortes</b>, z. B. <i>"Ich habe meinen Führerschein verloren in Jesteburg"</i>. Bitte geben Sie keine persönlichen Daten wie z. B. Ihren Namen ein.',
  ];
  public userInput = '';
  public language: 'de' | 'en' = 'de';
  public showDebug = false;
  public playTextToSpeech = false;
  public bestMatches = '';
  public isRecordingAudio = false;
  public mediaRecorder: MediaRecorder | undefined;

  public chatbotSession: ChatbotSession = { messages: [] };
  public apiParameters: ChatbotAPIPostParameters = {
    llm: 'gpt-4',
    embedding_model: 'text-embedding-3-large',
    language: this.language,
    skip_cache: false,
  };

  public awaitingAPIResponse = false;

  constructor(private httpClient: HttpClient) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.messageElements.changes.subscribe(() =>
      this.messageHistoryElement.nativeElement.scrollTo({ top: this.messageHistoryElement.nativeElement.scrollHeight, behavior: 'smooth' })
    );
  }

  onMessageSendClicked() {
    const sessionHistory = [...this.chatbotSession.messages];
    this.chatbotSession.messages.push({ user_message: this.userInput });

    const headers = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');
    const body: ChatbotSessionAPIPost = { messages: sessionHistory, user_message: this.userInput, parameters: { ...this.apiParameters, language: this.language } };
    this.awaitingAPIResponse = true;
    this.httpClient.post<ChatbotAPIPostResponse>('https://fitbot.dfki.de/api/chat', body, { headers }).subscribe((response) => {
      this.awaitingAPIResponse = false;
      if (!response.error) {
        this.userInput = '';
        this.chatbotSession.messages = response.messages;
        if (response.leistung) {
          this.chatbotSession.messages[this.chatbotSession.messages.length - 1].leistung = response.leistung;
        }

        if (response.best_matches) {
          this.bestMatches = response.best_matches;
        }
      }
    });
  }

  onShowDebugClicked() {
    this.showDebug = !this.showDebug;
  }

  onPlayTextToSpeechClicked() {
    this.playTextToSpeech = !this.playTextToSpeech;
  }

  onRecordAudioClicked() {
    if (!this.isRecordingAudio) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        this.isRecordingAudio = true;
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.start();
      });
    } else if (this.mediaRecorder) {
      this.isRecordingAudio = false;
      const audioChunks: Blob[] = [];
      this.mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);

        if (this.mediaRecorder?.state == 'inactive') {
          const blob = new Blob(audioChunks, { type: 'audio/mpeg-3' });
          const url = URL.createObjectURL(blob);
          console.log(url);
        }
      };
      this.mediaRecorder.stop();
    }
  }
}
