import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MediaRecorderService } from 'src/app/services/media-recorder.service';
import { cloneDeep } from 'lodash';

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
  leistung_id?: number;
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

export interface SpeechToTextAPIPostResponse {
  average_duration: number;
  data: string[];
  duration: number;
  is_generating: boolean;
  error?: any;
}

export interface TextToSpeechAPIPostResponse {
  average_duration: number;
  data: TextToSpeechData[];
  duration: number;
  is_generating: boolean;
  error?: any;
}

export interface TextToSpeechData {
  data: any;
  is_file: boolean;
  name: string;
  orig_name: string;
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
    '<b>Hallo!</b> Ich bin der Chatbot der Behördennummer 115 für die Stadt Frankfurt. Wie kann ich Ihnen helfen?',
    'Aktuell befinde ich mich in einer Testphase und freue mich, wenn Sie meine Feedbackmöglichkeiten nutzen.',
    '<b>Bitte nennen Sie mir Ihr Anliegen inkl. des Ortes</b>, z. B. <i>"Ich habe meinen Führerschein verloren in Frankfurt"</i>. Bitte geben Sie keine persönlichen Daten wie z. B. Ihren Namen ein.',
  ];

  public userGreetingsEn: string[] = [
    '<b>Hello!</b> I am the chatbot of the hotline 115 for the city of Frankfurt. How can I help you?',
    'Currently, I am in a testing phase and would appreciate it if you could use my feedback options.',
    '<b>Please state your concern including the location</b>, e.g. <i>"I have lost my driving license in Frankfurt"</i>. Please do not enter any personal data such as your name.',
  ];
  public userInput = '';
  public language: 'de' | 'en' = 'de';
  public showDebug = false;
  public playTextToSpeech = false;
  public bestMatches = '';
  public leistung: ChatbotLeistung | undefined;
  public isRecordingAudio = false;

  public oldSessions: ChatbotSession[] = [];
  public chatbotSession: ChatbotSession = { messages: [] };
  public apiParameters: ChatbotAPIPostParameters = {
    llm: 'gpt-4',
    embedding_model: 'text-embedding-3-large',
    language: this.language,
    skip_cache: false,
  };

  public awaitingAPIResponse = false;

  constructor(private httpClient: HttpClient, private mediaRecorderService: MediaRecorderService, private cr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.mediaRecorderService.audioFile$.subscribe((file) => {
      this.onAudioFileGenerated(file);
    });
  }

  ngAfterViewInit() {
    this.messageElements.changes.subscribe(() =>
      this.messageHistoryElement.nativeElement.scrollTo({ top: this.messageHistoryElement.nativeElement.scrollHeight, behavior: 'smooth' })
    );
  }

  onMessageSendClicked() {
    this.awaitingAPIResponse = true;
    this.fetchChatbotResponse(this.userInput).subscribe((response) => {
      this.awaitingAPIResponse = false;
      if (!response.error) {
        this.updateChatbotFromAPIResponse(response);
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
      this.isRecordingAudio = true;
      this.mediaRecorderService.startRecording();
    } else {
      this.isRecordingAudio = false;
      this.mediaRecorderService.stopRecording();
    }
  }

  onRemoveLeistungClicked() {
    this.leistung = undefined;
    this.chatbotSession.messages.push({ user_message: 'Anliegen zu anderer Leistung', system_response: 'Gern! Bitte geben Sie Ihr neues Anliegen ein!' });
    this.oldSessions.push(cloneDeep(this.chatbotSession));
    this.chatbotSession.messages = [];
  }

  private async onAudioFileGenerated(blob: Blob) {
    const base64StringFromMp3 = await readBlob(blob);
    if (base64StringFromMp3 && typeof base64StringFromMp3 === 'string') {
      this.awaitingAPIResponse = true;

      this.fetchSpeechToTextResponse(base64StringFromMp3.split(',')[1]).subscribe((response) => {
        const text = response.data[0];
        if (text) {
          this.userInput = text;
          this.fetchChatbotResponse(text).subscribe((response) => {
            this.awaitingAPIResponse = false;
            if (!response.error) {
              this.updateChatbotFromAPIResponse(response);
            }
          });
        }
      });
    }
  }

  private updateChatbotFromAPIResponse(response: ChatbotAPIPostResponse) {
    this.userInput = '';
    this.chatbotSession.messages = response.messages;
    if (response.leistung) {
      this.leistung = response.leistung;

      this.chatbotSession.messages[this.chatbotSession.messages.length - 1].leistung = response.leistung;
    }

    if (response.best_matches) {
      this.bestMatches = response.best_matches;
    }

    if (this.playTextToSpeech) {
      const chatbotResponseText = response.messages[response.messages.length - 1].system_response;
      if (chatbotResponseText) {
        this.fetchTextToSpeechResponse(chatbotResponseText).subscribe((response) => {
          if (!response.error) {
            let audio = new Audio();
            audio.src = 'https://dfki-3109.dfki.de/tts/file=' + response.data[0].name;
            audio.load();
            audio.play();
          }
        });
      }
    }
  }

  private fetchChatbotResponse(message: string) {
    const sessionHistory = [...this.chatbotSession.messages];
    this.chatbotSession.messages.push({ user_message: message });

    const headers = new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8');
    const body: ChatbotSessionAPIPost = {
      leistung_id: this.leistung?.id,
      messages: sessionHistory,
      user_message: message,
      parameters: { ...this.apiParameters, language: this.language },
    };

    return this.httpClient.post<ChatbotAPIPostResponse>('https://fitbot.dfki.de/api/chat', body, { headers });
  }

  private fetchSpeechToTextResponse(base64String: string) {
    return this.httpClient.post<SpeechToTextAPIPostResponse>('https://dfki-3109.dfki.de/asr/run/predict', {
      fn_index: 3,
      data: [
        this.language,
        {
          data: 'data:audio/wav;base64,' + base64String,
          name: 'sample_audio.mp3',
        },
      ],
    });
  }

  private fetchTextToSpeechResponse(text: string) {
    return this.httpClient.post<TextToSpeechAPIPostResponse>('https://dfki-3109.dfki.de/tts/run/predict', {
      data: [this.language, text],
    });
  }
}

function readBlob(blob: Blob) {
  return new Promise((resolve, reject) => {
    var fr = new FileReader();
    fr.onload = () => {
      resolve(fr.result);
    };
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}
