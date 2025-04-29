import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { cloneDeep } from 'lodash';
import { MediaRecorderService } from 'src/app/services/media-recorder.service';

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

type FlowiseAPIResponseType = {
  text: string;
  question: string;
  chatId: string;
  chatMessageId: string;
  sessionId: string;
  memoryType: string;
  agentReasoning: AgentReasoning[];
};

type AgentReasoning = {
  agentName: string;
  messages: string[];
  nodeName: string;
  nodeId: string;
};

type FlowiseHistory = {
  role: 'apiMessage' | 'userMessage';
  content: string;
};

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

interface ChatbotVersion {
  versionNumber: string;
  teilnehmer: string;
  url: string;
}

@Component({
  selector: 'app-zukunftstechnologie-bot',
  templateUrl: './zukunftstechnologie-bot.component.html',
  styleUrls: ['./zukunftstechnologie-bot.component.scss'],
})
export class ZukunftstechnologieBotComponent implements OnInit {
  @ViewChild('messageHistory') private messageHistoryElement!: ElementRef<HTMLElement>;
  @ViewChildren('messageElements') messageElements!: QueryList<any>;

  public versions: ChatbotVersion[] = [
    { versionNumber: '0.15', teilnehmer: 'Frankfurt', url: 'https://flowise.km.usu.com/api/v1/prediction/f969e215-e874-45f2-882f-e0209a787799' },
    { versionNumber: '0.15', teilnehmer: 'Aachen', url: 'https://flowise.km.usu.com/api/v1/prediction/f969e215-e874-45f2-882f-e0209a787799' },
    { versionNumber: '0.15', teilnehmer: 'Berlin', url: 'https://flowise.km.usu.com/api/v1/prediction/f969e215-e874-45f2-882f-e0209a787799' },
  ];
  public selectedVersion: ChatbotVersion | undefined = this.versions[0];

  public userGreetings: string[] = getDeUserGreeting(this.selectedVersion?.teilnehmer);
  public userGreetingsEn: string[] = getEnUserGreeting(this.selectedVersion?.teilnehmer);

  public userInput = '';
  public language: 'de' | 'en' = 'de';
  public showDebug = false;
  public playTextToSpeech = false;
  public agentChain = '';
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

  onVersionChange(event: Event) {
    const selectedVersion = this.versions.find((version) => version.teilnehmer === (event.target as HTMLSelectElement).value);
    if (selectedVersion) {
      this.selectedVersion = selectedVersion;
      this.userGreetings = getDeUserGreeting(this.selectedVersion?.teilnehmer);
      this.userGreetingsEn = getEnUserGreeting(this.selectedVersion?.teilnehmer);
    }
  }

  onMessageSendClicked() {
    this.awaitingAPIResponse = true;
    this.queryFlowise({ question: this.userInput, history: this.getFlowiseHistory() }).then((response) => {
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

  onSendFeedbackClicked() {
    const uuid = crypto.randomUUID();
    const subject = encodeURIComponent(`115-Chatbot-Feedback ${uuid}`);
    const body = encodeURIComponent(
      'Feedback: \n\n\n\n\n\nDebug-Informationen:\nAgentenverlauf: ' +
        this.agentChain +
        '\n\nChatverlauf:\n' +
        JSON.stringify(
          this.chatbotSession.messages.map((x) => ({ userInput: x.user_message, aiResponse: x.system_response })),
          null,
          2
        )
    );

    const email = 'sebastian.quendt@fitko.de';
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  private async onAudioFileGenerated(blob: Blob) {
    const base64StringFromMp3 = await readBlob(blob);
    if (base64StringFromMp3 && typeof base64StringFromMp3 === 'string') {
      this.awaitingAPIResponse = true;

      this.fetchSpeechToTextResponse(base64StringFromMp3.split(',')[1]).subscribe((response) => {
        const text = response.data[0];
        if (text) {
          this.userInput = text;
          this.queryFlowise({ question: text, history: this.getFlowiseHistory() }).then((response) => {
            this.awaitingAPIResponse = false;
            if (!response.error) {
              this.updateChatbotFromAPIResponse(response);
            }
          });
        }
      });
    }
  }

  private updateChatbotFromAPIResponse(response: FlowiseAPIResponseType) {
    this.userInput = '';
    this.chatbotSession.messages.push({ user_message: response.question, system_response: response.text });

    if (response?.agentReasoning?.length > 0) {
      this.agentChain = response.agentReasoning.map((x) => x.agentName).join(' -> ');
    }

    if (this.playTextToSpeech) {
      const chatbotResponseText = response.text;
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

  private getFlowiseHistory(): FlowiseHistory[] {
    return this.chatbotSession.messages.flatMap((message) => {
      const result: FlowiseHistory[] = [];
      if (message.user_message) {
        result.push({ role: 'userMessage', content: message.user_message });
      }
      if (message.system_response) {
        result.push({ role: 'apiMessage', content: message.system_response });
      }
      return result;
    });
  }

  private async queryFlowise(data: { question: string; history: FlowiseHistory[] }) {
    const response = await fetch('https://flowise.km.usu.com/api/v1/prediction/f969e215-e874-45f2-882f-e0209a787799', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...data, overrideConfig: { vars: { language: getLanguageFromKey(this.language) } } }),
    });
    const result = await response.json();
    return result;
  }
}

function getLanguageFromKey(langKey: string) {
  if (langKey === 'en') {
    return 'english';
  } else if (langKey === 'de') {
    return 'deutsch';
  } else {
    return 'de';
  }
}

function getDeUserGreeting(teilnehmer?: string) {
  return [
    '<b>Hallo!</b> Ich bin der Chatbot der Behördennummer 115 für die Stadt ' + teilnehmer + '. Wie kann ich Ihnen helfen?',
    'Aktuell befinde ich mich in einer Testphase und freue mich, wenn Sie meine Feedbackmöglichkeiten nutzen.',
    '<b>Bitte nennen Sie mir Ihr Anliegen</b>, z. B. <i>"Ich habe meinen Führerschein verloren"</i>. Bitte geben Sie keine persönlichen Daten wie z. B. Ihren Namen ein.',
  ];
}

function getEnUserGreeting(teilnehmer?: string) {
  return [
    '<b>Hello!</b> I am the chatbot of the hotline 115 for the city of ' + teilnehmer + '. How can I help you?',
    'Currently, I am in a testing phase and would appreciate it if you could use my feedback options.',
    '<b>Please state your concern including</b>, e.g. <i>"I have lost my driving license"</i>. Please do not enter any personal data such as your name.',
  ];
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
