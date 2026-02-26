import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { cloneDeep } from 'lodash';

export type LanguageType = 'en' | 'de' | 'de(einfach)' | 'fr';
export type ChatbotDialogType = 'system_greeting' | 'find_leistung' | 'keine_leistung_gefunden' | '"question_answering"';
export type CommunalType = 'stadt' | 'kreis' | 'gemeinde' | 'behörde';
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

interface ChatbotTeilnehmer {
  id: number;
  versionNumber: string;
  name: string;
  type: CommunalType;
  kontakt: string;
  url: string;
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

  public teilnehmer: ChatbotTeilnehmer[] = [
    {
      id: 1,
      versionNumber: '0.5',
      name: 'Frankfurt',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;anna.ahlbrandt@stadt-frankfurt.de',
      url: 'https://flowise.test.115.de/api/v1/prediction/60b5662b-c194-487c-b507-99e724483432',
    } as ChatbotTeilnehmer,
    {
      id: 2,
      versionNumber: '0.5',
      name: 'Aachen',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;Thomas.Bruesseler@mail.aachen.de',
      url: 'https://flowise.test.115.de/api/v1/prediction/badc6889-52e0-409e-aa63-f4bb74d809b2',
    } as ChatbotTeilnehmer,
    {
      id: 3,
      versionNumber: '0.5',
      name: 'Berlin',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;mario.anton@senatskanzlei.berlin.de',
      url: 'https://flowise.test.115.de/api/v1/prediction/669ffe8a-e7d7-427e-bba5-382206b38a1b',
    } as ChatbotTeilnehmer,
    {
      id: 4,
      versionNumber: '0.5',
      name: 'Bielefeld',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com',
      url: 'https://flowise.test.115.de/api/v1/prediction/25de82c1-8cc3-439c-89cd-42a9424eb274',
    } as ChatbotTeilnehmer,
    {
      id: 5,
      versionNumber: '0.5',
      name: 'Essen',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;33-3-it@einwohneramt.essen.de',
      url: 'https://flowise.test.115.de/api/v1/prediction/8d2103bc-98dc-4f6e-87b1-c8d04a6d936e',
    } as ChatbotTeilnehmer,
    {
      id: 6,
      versionNumber: '0.5',
      name: 'Grünheide',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;Behoerdennummer115@MDJD.Brandenburg.de',
      url: 'https://flowise.test.115.de/api/v1/prediction/940a524c-c020-4d4f-9677-e00f4989fc32',
    } as ChatbotTeilnehmer,
    {
      id: 7,
      versionNumber: '0.5',
      name: 'Magdeburg',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com',
      url: 'https://flowise.test.115.de/api/v1/prediction/9104b658-d77a-4e91-9f24-db00e412cc43',
    } as ChatbotTeilnehmer,
    {
      id: 8,
      versionNumber: '0.5',
      name: 'Kassel',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com',
      url: 'https://flowise.test.115.de/api/v1/prediction/f19a5435-f30b-44da-99d8-79a7e30c773a',
    } as ChatbotTeilnehmer,
    {
      id: 9,
      versionNumber: '0.5',
      name: 'Königstein',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com',
      url: 'https://flowise.test.115.de/api/v1/prediction/9d3db172-5128-4cab-9885-39dbe12f182d',
    } as ChatbotTeilnehmer,
    {
      id: 10,
      versionNumber: '0.5',
      name: 'Potsdam',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;Behoerdennummer115@MDJD.Brandenburg.de',
      url: 'https://flowise.test.115.de/api/v1/prediction/cae8bdf4-0e05-44ab-9ec2-fe802204c4ed',
    } as ChatbotTeilnehmer,
    {
      id: 11,
      versionNumber: '0.5',
      name: 'Bernau',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;Behoerdennummer115@MDJD.Brandenburg.de',
      url: 'https://flowise.test.115.de/api/v1/prediction/890e4618-55cc-4332-9f6d-79af7c3fc43b',
    } as ChatbotTeilnehmer,
    {
      id: 12,
      versionNumber: '0.5',
      name: 'Schönefeld',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;Behoerdennummer115@MDJD.Brandenburg.de',
      url: 'https://flowise.test.115.de/api/v1/prediction/40d65016-a6de-49cf-a6cf-e4cf8d5d7204',
    } as ChatbotTeilnehmer,
    {
      id: 13,
      versionNumber: '0.5',
      name: 'Dahme Spreewald',
      type: 'kreis',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;Behoerdennummer115@MDJD.Brandenburg.de',
      url: 'https://flowise.test.115.de/api/v1/prediction/e8a8968d-c576-4c7b-b06e-bf60718229e5',
    } as ChatbotTeilnehmer,
    {
      id: 14,
      versionNumber: 'K 0.2',
      name: 'Harburg',
      type: 'kreis',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;h.huch@lkharburg.de',
      url: 'https://flowise.test.115.de/api/v1/prediction/fb8f45f7-e6af-43f4-9a8e-f6fd761f9f30',
    } as ChatbotTeilnehmer,
    {
      id: 15,
      versionNumber: '0.5',
      name: 'Karlsruhe',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com',
      url: 'https://flowise.test.115.de/api/v1/prediction/262a4d6d-dab7-461c-95d5-26d6cf2b07f3',
    } as ChatbotTeilnehmer,
    {
      id: 16,
      versionNumber: '0.5',
      name: 'Burg (Spreewald)',
      type: 'gemeinde',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;Behoerdennummer115@MDJD.Brandenburg.de',
      url: 'https://flowise.test.115.de/api/v1/prediction/50d66d4e-12f6-4600-a5a3-3bb4a2bd3d92',
    } as ChatbotTeilnehmer,
    {
      id: 17,
      versionNumber: 'K 0.2',
      name: 'Potsdam-Mittelmark',
      type: 'kreis',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;Behoerdennummer115@MDJD.Brandenburg.de',
      url: 'https://flowise.test.115.de/api/v1/prediction/44aafca1-1f03-4761-97a2-f3296543b51d',
    } as ChatbotTeilnehmer,
    {
      id: 18,
      versionNumber: '0.5',
      name: 'Erfurt',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;',
      url: 'https://flowise.test.115.de/api/v1/prediction/f5b8df88-b4bd-4883-b079-d95322a3b395',
    } as ChatbotTeilnehmer,
    {
      id: 19,
      versionNumber: '0.5',
      name: 'Oebisfelde-Weferlingen',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;',
      url: 'https://flowise.test.115.de/api/v1/prediction/1b1d2681-2a3c-4d5c-a32b-87bcff40cf46',
    } as ChatbotTeilnehmer,
    {
      id: 20,
      versionNumber: '0.5',
      name: 'Chemnitz',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;',
      url: 'https://flowise.test.115.de/api/v1/prediction/48ea2786-4048-4dce-b66e-7243a3f5d112',
    } as ChatbotTeilnehmer,
    {
      id: 21,
      versionNumber: '0.1',
      name: 'Zoll',
      type: 'behörde',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;',
      url: 'https://flowise.test.115.de/api/v1/prediction/a7e93901-d8cc-42c9-9e99-bfe90d45b483',
    } as ChatbotTeilnehmer,
    {
      id: 22,
      versionNumber: 'K 0.2',
      name: 'Karlsruhe (LK)',
      type: 'kreis',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;',
      url: 'https://flowise.test.115.de/api/v1/prediction/72b0cd35-6093-479a-b944-72e5c2390e10',
    } as ChatbotTeilnehmer,
    {
      id: 23,
      versionNumber: '0.5',
      name: 'Hamburg',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;',
      url: 'https://flowise.test.115.de/api/v1/prediction/3c1fed1d-ec83-4984-8bf3-4f99f0ed5380',
    } as ChatbotTeilnehmer,
    {
      id: 24,
      versionNumber: '0.5',
      name: 'Stuttgart',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;',
      url: 'https://flowise.test.115.de/api/v1/prediction/7ea93200-477a-4a48-b8b4-a247cce99421',
    } as ChatbotTeilnehmer,
    {
      id: 25,
      versionNumber: '0.8',
      name: 'Frankfurt',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;',
      url: 'https://flowise.test.115.de/api/v1/prediction/538818d5-8b4e-4d90-888c-609c110024cc',
    } as ChatbotTeilnehmer,
    {
      id: 26,
      versionNumber: '0.5',
      name: 'Ludwigshafen',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;',
      url: 'https://flowise.test.115.de/api/v1/prediction/bf2e9bfd-d4ad-4928-87ef-c1c1f3b8969b',
    } as ChatbotTeilnehmer,
    {
      id: 27,
      versionNumber: '0.8',
      name: 'Eutin',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;',
      url: 'https://flowise.test.115.de/api/v1/prediction/34ecf714-cb6b-4f54-a61b-720d27823ad2',
    } as ChatbotTeilnehmer,
    {
      id: 28,
      versionNumber: '0.8',
      name: 'Wedel',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;',
      url: 'https://flowise.test.115.de/api/v1/prediction/21741939-b3ba-4d07-8969-737395161c7c',
    } as ChatbotTeilnehmer,
    {
      id: 29,
      versionNumber: '0.8',
      name: 'Bad Oldesloe',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;',
      url: 'https://flowise.test.115.de/api/v1/prediction/4981069a-e5b4-46d3-ad0e-05bd66112a11',
    } as ChatbotTeilnehmer,
  ].sort((a, b) => a.name.localeCompare(b.name));

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
    const selectedVersion = this.teilnehmer.find((version) => version.id === parseInt((event.target as HTMLSelectElement).value));
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
    const response = await this.queryFlowise(this.selectedVersion.url, { question: this.userInput, history: this.getFlowiseHistory() });
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
    const subject = encodeURIComponent('115-Chatbot ' + this.selectedVersion?.name + ' ' + this.selectedVersion?.versionNumber + ': Feedback ' + category + ' ' + uuid);
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

    const email = this.selectedVersion?.kontakt;
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
          ...data,
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
        return { messages: getDeUserGreeting(this.selectedVersion?.name, this.selectedVersion?.type).map((x) => ({ system_response: x })) };
      case 'fr':
        return { messages: getFrUserGreeting(this.selectedVersion?.name, this.selectedVersion?.type).map((x) => ({ system_response: x })) };
      case 'en':
      default:
        return { messages: getEnUserGreeting(this.selectedVersion?.name, this.selectedVersion?.type).map((x) => ({ system_response: x })) };
    }
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

function getDeUserGreeting(teilnehmer?: string, type?: CommunalType) {
  return [
    '<b>Hallo!</b> Ich bin der Chatbot der Behördennummer 115 für ' + getTeilnehmerTypeString('de', type) + teilnehmer + '. Wie kann ich dir helfen?',
    'Aktuell befinde ich mich in einer Testphase und freue mich, wenn du meine Feedbackmöglichkeiten nutzt.',
    '<b>Bitte nenne mir dein Anliegen</b>, z. B. <i>"Ich habe meinen Führerschein verloren"</i>. Bitte gib keine persönlichen Daten wie z. B. deinen Namen ein.',
  ];
}

function getEnUserGreeting(teilnehmer?: string, type?: CommunalType) {
  return [
    '<b>Hello!</b> I am the chatbot of the hotline 115 for ' + getTeilnehmerTypeString('de', type) + teilnehmer + '. How can I help you?',
    'Currently, I am in a testing phase and would appreciate it if you could use my feedback options.',
    '<b>Please state your concern including</b>, e.g. <i>"I have lost my driving license"</i>. Please do not enter any personal data such as your name.',
  ];
}

function getFrUserGreeting(teilnehmer?: string, type?: CommunalType) {
  return [
    '<b>Bonjour !</b> Je suis le chatbot du numéro officiel 115 pour ' + getTeilnehmerTypeString('de', type) + teilnehmer + ". Comment puis-je t'aider ?",
    "Je suis actuellement en phase de test et je serais ravi si tu utilisais mes options de retour d'expérience.",
    '<b>Merci de me décrire ton besoin</b>, par exemple : <i>"J\'ai perdu mon permis de conduire"</i>. Merci de ne pas entrer de données personnelles telles que ton nom.',
  ];
}

function getTeilnehmerTypeString(lang: LanguageType, type?: CommunalType): string {
  if (type === 'stadt') {
    if (lang === 'de' || lang === 'de(einfach)') {
      return 'die Stadt ';
    } else if (lang === 'en') {
      return 'the city of ';
    } else if (lang === 'fr') {
      return 'la ville ';
    }
  } else if (type === 'kreis') {
    if (lang === 'de' || lang === 'de(einfach)') {
      return 'den Landkreis ';
    } else if (lang === 'en') {
      return 'the district of ';
    } else if (lang === 'fr') {
      return 'le district de ';
    }
  } else if (type === 'gemeinde') {
    if (lang === 'de' || lang === 'de(einfach)') {
      return 'die Gemeinde ';
    } else if (lang === 'en') {
      return 'the municipality of ';
    } else if (lang === 'fr') {
      return 'le commune de ';
    }
  } else if (type === 'behörde') {
    if (lang === 'de' || lang === 'de(einfach)') {
      return 'die Behörde ';
    } else if (lang === 'en') {
      return 'the Behörde ';
    } else if (lang === 'fr') {
      return 'le Behörde ';
    }
  }
  return '';
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
