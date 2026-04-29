import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { cloneDeep } from 'lodash';
import { kiBots } from './ki-bots';

export type LanguageType = 'en' | 'de' | 'de(einfach)' | 'fr';
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
  language: LanguageType;
  skip_cache: boolean;
}

type FlowiseAPIResponseType = {
  text: string;
  question: string;
  chatId: string;
  chatMessageId: string;
  sessionId: string;
  memoryType: string;
  agentFlowExecutedData: AgentFlowExecutedData[];
};

type AgentFlowExecutedData = {
  nodeId: string;
  nodeLabel: string;
  data: any;
};

type FlowiseHistory = {
  role: 'apiMessage' | 'userMessage';
  content: string;
};

export interface ChatbotTeilnehmer {
  id: string;
  name: string;
}

interface FeedbackDebugInfos {
  bereinigtesAnliegen: string;
  anliegenKontext: string;
  botAntwort: string;
}
@Component({
  selector: 'app-ki-bot',
  templateUrl: './ki-bot.component.html',
  styleUrls: ['./ki-bot.component.scss'],
  standalone: false,
})
export class ZukunftstechnologieBotComponent implements OnInit {
  @ViewChild('messageHistory') private messageHistoryElement!: ElementRef<HTMLElement>;
  @ViewChildren('messageElements') messageElements!: QueryList<any>;

  private flowiseBaseAPIURL = 'https://flowise.test.115.de/api/v1/prediction/';

  public teilnehmer: ChatbotTeilnehmer[] = kiBots.sort((a, b) => a.name.localeCompare(b.name));

  public selectedVersion: ChatbotTeilnehmer | undefined = this.teilnehmer[0];

  public workingStateElements = ['Bestimme Zuständigkeit...', 'Suche Informationen...', 'Erstelle Antwort...'];
  public currentWorkingState = '';

  public userInput = '';
  public language: LanguageType = 'de';
  public showDebug = false;
  public playTextToSpeech = false;
  public debugInfos: FeedbackDebugInfos = { anliegenKontext: '', bereinigtesAnliegen: '', botAntwort: '' };
  public leistung: ChatbotLeistung | undefined;
  public isRecordingAudio = false;

  public oldSessions: ChatbotSession[] = [];
  public chatbotSession: ChatbotSession = this.getUserGreeting();
  public apiParameters: ChatbotAPIPostParameters = {
    llm: 'gpt-4',
    embedding_model: 'text-embedding-3-large',
    language: this.language,
    skip_cache: false,
  };

  public awaitingAPIResponse = false;
  public apiError: any = '';

  public flowiseDown = false;

  public sessionID: string | undefined = undefined;

  constructor(
    private httpClient: HttpClient,
    public sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.pingFlowiseAPI();
  }

  ngAfterViewInit() {
    this.messageElements.changes.subscribe(() =>
      this.messageHistoryElement.nativeElement.scrollTo({ top: this.messageHistoryElement.nativeElement.scrollHeight, behavior: 'smooth' }),
    );
  }

  onTeilnehmerChange(event: Event) {
    const selectedVersion = this.teilnehmer.find((version) => version.id === (event.target as HTMLSelectElement).value);
    if (selectedVersion) {
      this.selectedVersion = selectedVersion;
      this.chatbotSession = this.getUserGreeting();
    }
  }

  async onMessageSendClicked() {
    if (!this.selectedVersion) {
      return;
    }

    this.awaitingAPIResponse = true;
    this.showWorkingState(0);
    const response = await this.queryFlowise(this.getFlowiseUrl(this.selectedVersion.id), { question: this.userInput, history: this.getFlowiseHistory() });
    this.awaitingAPIResponse = false;
    if (response) {
      this.updateChatbotFromAPIResponse(response);
    }
  }

  private showWorkingState(index: number) {
    this.currentWorkingState = this.workingStateElements[index];
    setTimeout(() => {
      if (this.awaitingAPIResponse) {
        this.currentWorkingState = this.workingStateElements[index + 1];
        if (index < this.workingStateElements.length - 2) {
          this.showWorkingState(index + 1);
        }
      }
    }, 5000);
  }

  onShowDebugClicked() {
    this.showDebug = !this.showDebug;
  }

  onRemoveLeistungClicked() {
    this.leistung = undefined;
    this.chatbotSession.messages.push({ user_message: 'Anliegen zu anderer Leistung', system_response: 'Gern! Bitte geben Sie Ihr neues Anliegen ein!' });
    this.oldSessions.push(cloneDeep(this.chatbotSession));
    this.chatbotSession.messages = [];
  }

  onSendFeedbackClicked(category: string) {
    const uuid = this.sessionID ?? crypto.randomUUID();
    const subject = encodeURIComponent('115-Chatbot ' + this.selectedVersion?.name + ' ' + ': Feedback ' + category + ' ' + uuid);
    const body = encodeURIComponent(
      'Feedback: \n\n\n\n\n\nDebug-Informationen:\nGesendete Nachrichten: ' +
        this.chatbotSession.messages
          .filter((x) => x.user_message)
          .map((x) => x.user_message)
          .join('\n____\n') +
        '\n\nBot-Antwort: ' +
        (this.debugInfos.botAntwort.length > 1000 ? this.debugInfos.botAntwort.substring(0, 1000) + '...' : this.debugInfos.botAntwort) +
        '\n\nBereinigtes Anliegen: ' +
        this.debugInfos.bereinigtesAnliegen +
        '\n\nKontext: ' +
        this.debugInfos.anliegenKontext +
        '\n\nAufgetretene Fehler: ' +
        this.apiError +
        '\n\n',
    );

    const email = 'sebastian.quendt@fitko.de';
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  onRefreshClicked() {
    this.chatbotSession = this.getUserGreeting();
    this.oldSessions = [];
    this.debugInfos = { anliegenKontext: '', bereinigtesAnliegen: '', botAntwort: '' };
    this.userInput = '';
    this.leistung = undefined;
  }

  private updateChatbotFromAPIResponse(response: FlowiseAPIResponseType) {
    this.userInput = '';
    this.chatbotSession.messages.push({ user_message: response.question, system_response: response.text });
    this.sessionID = response.sessionId;

    const agentData = response.agentFlowExecutedData;
    if (agentData.length > 0) {
      this.debugInfos.botAntwort = response.text;

      const lastEntry = agentData[agentData.length - 1];
      this.debugInfos.bereinigtesAnliegen = lastEntry.data.state.anliegen;
      this.debugInfos.anliegenKontext = lastEntry.data.state.anliegenKontext;
    }
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

  private getFlowiseContext() {
    return this.chatbotSession.messages.flatMap((message) => {
      const result = [];
      if (message.user_message) {
        result.push({ user: message.user_message });
      }
      if (message.system_response) {
        result.push({ ai: message.system_response });
      }
      return result;
    });
  }

  private async queryFlowise(url: string, data: { question: string; history: FlowiseHistory[] }) {
    try {
      let response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: data.question,
          overrideConfig: {
            vars: { language: getLanguageFromKey(this.language), history: JSON.stringify(this.getFlowiseContext()) },
          },
        }),
      });
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      this.apiError = '';

      const result = await response.json();
      return result as FlowiseAPIResponseType;
    } catch (e) {
      this.apiError = e;
      this.pingFlowiseAPI();
      return undefined;
    }
  }

  private pingFlowiseAPI() {
    this.httpClient.get('https://flowise.test.115.de/api/v1/ping', { responseType: 'text' }).subscribe({
      next: (result) => {
        this.flowiseDown = result !== 'pong';
      },
      error: (err) => {
        console.error('Fehler beim HTTP-Request:', err);
        this.flowiseDown = true;
      },
    });
  }

  onLanguageChange($event: Event) {
    this.language = ($event.target as HTMLSelectElement).value as LanguageType;
    this.chatbotSession = this.getUserGreeting();
  }

  private getUserGreeting(): ChatbotSession {
    switch (this.language) {
      case 'de':
      case 'de(einfach)':
        return { messages: getDeUserGreeting(this.selectedVersion?.name).map((x) => ({ system_response: x })) };
      case 'fr':
        return { messages: getFrUserGreeting(this.selectedVersion?.name).map((x) => ({ system_response: x })) };
      case 'en':
      default:
        return { messages: getEnUserGreeting(this.selectedVersion?.name).map((x) => ({ system_response: x })) };
    }
  }

  private getFlowiseUrl(id: string) {
    return this.flowiseBaseAPIURL + id;
  }
}

function getLanguageFromKey(langKey: LanguageType) {
  if (langKey === 'en') {
    return 'english';
  } else if (langKey === 'de') {
    return 'deutsch';
  } else if (langKey === 'de(einfach)') {
    return 'einfache Sprache';
  } else if (langKey === 'fr') {
    return 'französisch';
  } else {
    return 'de';
  }
}

function getDeUserGreeting(teilnehmer?: string) {
  return [
    '<b>Hallo!</b> Ich bin der Chatbot der Behördennummer 115 für ' + teilnehmer + '. Wie kann ich dir helfen?',
    'Aktuell befinde ich mich in einer Testphase und freue mich, wenn du meine Feedbackmöglichkeiten nutzt.',
    '<b>Bitte nenne mir dein Anliegen</b>, z. B. <i>"Ich habe meinen Führerschein verloren"</i>. Bitte gib keine persönlichen Daten wie z. B. deinen Namen ein.',
  ];
}

function getEnUserGreeting(teilnehmer?: string) {
  return [
    '<b>Hello!</b> I am the chatbot of the hotline 115 for ' + teilnehmer + '. How can I help you?',
    'Currently, I am in a testing phase and would appreciate it if you could use my feedback options.',
    '<b>Please state your concern including</b>, e.g. <i>"I have lost my driving license"</i>. Please do not enter any personal data such as your name.',
  ];
}

function getFrUserGreeting(teilnehmer?: string) {
  return [
    '<b>Bonjour !</b> Je suis le chatbot du numéro officiel 115 pour ' + teilnehmer + ". Comment puis-je t'aider ?",
    "Je suis actuellement en phase de test et je serais ravi si tu utilisais mes options de retour d'expérience.",
    '<b>Merci de me décrire ton besoin</b>, par exemple : <i>"J\'ai perdu mon permis de conduire"</i>. Merci de ne pas entrer de données personnelles telles que ton nom.',
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
