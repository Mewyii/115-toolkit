import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
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
  language: 'en' | 'de' | 'fr';
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
  type: 'stadt' | 'kreis';
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
})
export class ZukunftstechnologieBotComponent implements OnInit {
  @ViewChild('messageHistory') private messageHistoryElement!: ElementRef<HTMLElement>;
  @ViewChildren('messageElements') messageElements!: QueryList<any>;

  public versions: ChatbotVersion[] = [
    {
      versionNumber: '0.4',
      teilnehmer: 'Frankfurt',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;anna.ahlbrandt@stadt-frankfurt.de',
      url: 'https://flowise.km.usu.com/api/v1/prediction/60b5662b-c194-487c-b507-99e724483432',
    } as ChatbotVersion,
    {
      versionNumber: '0.4',
      teilnehmer: 'Aachen',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;stefan.ganser@mail.aachen.de',
      url: 'https://flowise.km.usu.com/api/v1/prediction/badc6889-52e0-409e-aa63-f4bb74d809b2',
    } as ChatbotVersion,
    {
      versionNumber: '0.4',
      teilnehmer: 'Berlin',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;mario.anton@senatskanzlei.berlin.de',
      url: 'https://flowise.km.usu.com/api/v1/prediction/669ffe8a-e7d7-427e-bba5-382206b38a1b',
    } as ChatbotVersion,
    {
      versionNumber: '0.4',
      teilnehmer: 'Bielefeld',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com',
      url: 'https://flowise.km.usu.com/api/v1/prediction/25de82c1-8cc3-439c-89cd-42a9424eb274',
    } as ChatbotVersion,
    {
      versionNumber: '0.4',
      teilnehmer: 'Essen',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;33-3-it@einwohneramt.essen.de',
      url: 'https://flowise.km.usu.com/api/v1/prediction/8d2103bc-98dc-4f6e-87b1-c8d04a6d936e',
    } as ChatbotVersion,
    {
      versionNumber: '0.4',
      teilnehmer: 'Grünheide',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;Behoerdennummer115@MDJD.Brandenburg.de',
      url: 'https://flowise.km.usu.com/api/v1/prediction/940a524c-c020-4d4f-9677-e00f4989fc32',
    } as ChatbotVersion,
    {
      versionNumber: '0.4',
      teilnehmer: 'Magdeburg',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com',
      url: 'https://flowise.km.usu.com/api/v1/prediction/9104b658-d77a-4e91-9f24-db00e412cc43',
    } as ChatbotVersion,
    {
      versionNumber: '0.4',
      teilnehmer: 'Kassel',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com',
      url: 'https://flowise.km.usu.com/api/v1/prediction/f19a5435-f30b-44da-99d8-79a7e30c773a',
    } as ChatbotVersion,
    {
      versionNumber: '0.4',
      teilnehmer: 'Königstein',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com',
      url: 'https://flowise.km.usu.com/api/v1/prediction/9d3db172-5128-4cab-9885-39dbe12f182d',
    } as ChatbotVersion,
    {
      versionNumber: '0.4',
      teilnehmer: 'Frankfurt Gemini',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;anna.ahlbrandt@stadt-frankfurt.de',
      url: 'https://flowise.km.usu.com/api/v1/prediction/7eefa209-edd3-4aed-b8d1-20ab89308f0c',
    } as ChatbotVersion,
    {
      versionNumber: '0.4',
      teilnehmer: 'Potsdam',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;Behoerdennummer115@MDJD.Brandenburg.de',
      url: 'https://flowise.km.usu.com/api/v1/prediction/cae8bdf4-0e05-44ab-9ec2-fe802204c4ed',
    } as ChatbotVersion,
    {
      versionNumber: '0.4',
      teilnehmer: 'Bernau',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;Behoerdennummer115@MDJD.Brandenburg.de',
      url: 'https://flowise.km.usu.com/api/v1/prediction/890e4618-55cc-4332-9f6d-79af7c3fc43b',
    } as ChatbotVersion,
    {
      versionNumber: '0.4',
      teilnehmer: 'Schönefeld',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;Behoerdennummer115@MDJD.Brandenburg.de',
      url: 'https://flowise.km.usu.com/api/v1/prediction/40d65016-a6de-49cf-a6cf-e4cf8d5d7204',
    } as ChatbotVersion,
    {
      versionNumber: '0.4',
      teilnehmer: 'Dahme Spreewald',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;Behoerdennummer115@MDJD.Brandenburg.de',
      url: 'https://flowise.km.usu.com/api/v1/prediction/e8a8968d-c576-4c7b-b06e-bf60718229e5',
    } as ChatbotVersion,
    {
      versionNumber: 'K 0.1',
      teilnehmer: 'Harburg',
      type: 'kreis',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com;h.huch@lkharburg.de',
      url: 'https://flowise.km.usu.com/api/v1/prediction/20d4ee9d-1617-4847-af3c-a30a738e1b6f',
    } as ChatbotVersion,
    {
      versionNumber: '0.4',
      teilnehmer: 'Karlsruhe',
      type: 'stadt',
      kontakt: 'sebastian.quendt@fitko.de;henry.michel@usu.com',
      url: 'https://flowise.km.usu.com/api/v1/prediction/262a4d6d-dab7-461c-95d5-26d6cf2b07f3',
    } as ChatbotVersion,
  ].sort((a, b) => a.teilnehmer.localeCompare(b.teilnehmer));

  public selectedVersion: ChatbotVersion | undefined = this.versions[0];

  public workingStateElements = ['Bestimme Zuständigkeit...', 'Suche Informationen...', 'Erstelle Antwort...'];
  public currentWorkingState = '';

  public userInput = '';
  public language: 'de' | 'en' | 'fr' = 'de';
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

  constructor(private httpClient: HttpClient, private mediaRecorderService: MediaRecorderService, public sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.mediaRecorderService.audioFile$.subscribe((file) => {
      this.onAudioFileGenerated(file);
    });

    this.pingFlowiseAPI();
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

  onSendFeedbackClicked(category: string) {
    const uuid = crypto.randomUUID();
    const subject = encodeURIComponent('115-Chatbot ' + this.selectedVersion?.teilnehmer + ' ' + this.selectedVersion?.versionNumber + ': Feedback ' + category + ' ' + uuid);
    const body = encodeURIComponent(
      'Feedback: \n\n\n\n\n\nDebug-Informationen:\nZuletzt gesendete Nachricht: ' +
        this.chatbotSession.messages[this.chatbotSession.messages.length - 1].user_message +
        '\nBot-Antwort: ' +
        this.debugInfos.botAntwort +
        '\nBereinigtes Anliegen: ' +
        this.debugInfos.bereinigtesAnliegen +
        '\nKontext: ' +
        this.debugInfos.anliegenKontext +
        '\nAufgetretene Fehler: ' +
        this.apiError +
        '\n\n'
    );

    const email = this.selectedVersion?.kontakt;
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  private async onAudioFileGenerated(blob: Blob) {
    if (!this.selectedVersion) {
      return;
    }

    const base64StringFromMp3 = await readBlob(blob);
    if (base64StringFromMp3 && typeof base64StringFromMp3 === 'string') {
      this.awaitingAPIResponse = true;

      this.fetchSpeechToTextResponse(base64StringFromMp3.split(',')[1]).subscribe((response) => {
        const text = response.data[0];
        if (text && this.selectedVersion) {
          this.userInput = text;
          this.queryFlowise(this.selectedVersion.url, { question: text, history: this.getFlowiseHistory() }).then((response) => {
            this.awaitingAPIResponse = false;
            if (response) {
              this.updateChatbotFromAPIResponse(response);
            }
          });
        }
      });
    }
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

    const agentData = response.agentFlowExecutedData;
    if (agentData.length > 0) {
      this.debugInfos.botAntwort = response.text;

      const lastEntry = agentData[agentData.length - 1];
      this.debugInfos.bereinigtesAnliegen = lastEntry.data.state.anliegen;
      this.debugInfos.anliegenKontext = lastEntry.data.state.anliegenKontext;
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
    this.httpClient.get('https://flowise.km.usu.com/api/v1/ping', { responseType: 'text' }).subscribe({
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
    this.language = ($event.target as HTMLSelectElement).value as 'de' | 'en' | 'fr';
    this.chatbotSession = this.getUserGreeting();
  }

  private getUserGreeting(): ChatbotSession {
    switch (this.language) {
      case 'de':
        return { messages: getDeUserGreeting(this.selectedVersion?.teilnehmer, this.selectedVersion?.type).map((x) => ({ system_response: x })) };
      case 'fr':
        return { messages: getFrUserGreeting(this.selectedVersion?.teilnehmer, this.selectedVersion?.type).map((x) => ({ system_response: x })) };
      case 'en':
      default:
        return { messages: getEnUserGreeting(this.selectedVersion?.teilnehmer, this.selectedVersion?.type).map((x) => ({ system_response: x })) };
    }
  }
}

function getLanguageFromKey(langKey: string) {
  if (langKey === 'en') {
    return 'english';
  } else if (langKey === 'de') {
    return 'deutsch';
  } else if (langKey === 'fr') {
    return 'französisch';
  } else {
    return 'de';
  }
}

function getDeUserGreeting(teilnehmer?: string, type?: 'stadt' | 'kreis') {
  return [
    '<b>Hallo!</b> Ich bin der Chatbot der Behördennummer 115 für ' + getTeilnehmerTypeString('de', type) + teilnehmer + '. Wie kann ich dir helfen?',
    'Aktuell befinde ich mich in einer Testphase und freue mich, wenn du meine Feedbackmöglichkeiten nutzt.',
    '<b>Bitte nenne mir dein Anliegen</b>, z. B. <i>"Ich habe meinen Führerschein verloren"</i>. Bitte gib keine persönlichen Daten wie z. B. deinen Namen ein.',
  ];
}

function getEnUserGreeting(teilnehmer?: string, type?: 'stadt' | 'kreis') {
  return [
    '<b>Hello!</b> I am the chatbot of the hotline 115 for ' + getTeilnehmerTypeString('de', type) + teilnehmer + '. How can I help you?',
    'Currently, I am in a testing phase and would appreciate it if you could use my feedback options.',
    '<b>Please state your concern including</b>, e.g. <i>"I have lost my driving license"</i>. Please do not enter any personal data such as your name.',
  ];
}

function getFrUserGreeting(teilnehmer?: string, type?: 'stadt' | 'kreis') {
  return [
    '<b>Bonjour !</b> Je suis le chatbot du numéro officiel 115 pour ' + getTeilnehmerTypeString('de', type) + teilnehmer + ". Comment puis-je t'aider ?",
    "Je suis actuellement en phase de test et je serais ravi si tu utilisais mes options de retour d'expérience.",
    '<b>Merci de me décrire ton besoin</b>, par exemple : <i>"J\'ai perdu mon permis de conduire"</i>. Merci de ne pas entrer de données personnelles telles que ton nom.',
  ];
}

function getTeilnehmerTypeString(lang: 'de' | 'en' | 'fr', type?: 'stadt' | 'kreis'): string {
  if (type === 'stadt') {
    if (lang === 'de') {
      return 'die Stadt ';
    } else if (lang === 'en') {
      return 'the city of ';
    } else if (lang === 'fr') {
      return 'la ville ';
    }
  } else if (type === 'kreis') {
    if (lang === 'de') {
      return 'den Landkreis ';
    } else if (lang === 'en') {
      return 'the district of ';
    } else if (lang === 'fr') {
      return 'le district de ';
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
