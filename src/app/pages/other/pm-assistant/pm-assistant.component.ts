import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MAT_CHECKBOX_DEFAULT_OPTIONS, MatCheckboxDefaultOptions } from '@angular/material/checkbox';
import { DomSanitizer } from '@angular/platform-browser';

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

type ModeTypes = 'chat' | 'mailgenerator';

@Component({
    selector: 'app-pm-assistant',
    templateUrl: './pm-assistant.component.html',
    styleUrl: './pm-assistant.component.scss',
    providers: [{ provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: { clickAction: 'noop' } as MatCheckboxDefaultOptions }],
    standalone: false
})
export class PmAssistantComponent implements OnInit {
  @ViewChild('messageHistory') private messageHistoryElement!: ElementRef<HTMLElement>;
  @ViewChildren('messageElements') messageElements!: QueryList<any>;

  public workingStateElements = ['Bestimme Zuständigkeit...', 'Suche Informationen...', 'Erstelle Antwort...'];
  public currentWorkingState = '';

  public userInput = '';
  public language: 'de' | 'en' | 'fr' = 'de';
  public showDebug = false;
  public agentChain = '';
  public leistung: ChatbotLeistung | undefined;

  public chatbotSession: ChatbotSession = this.getUserGreeting();

  public awaitingAPIResponse = false;
  public apiError: any = '';

  public flowiseDown = false;

  public mode: ModeTypes = 'chat';

  constructor(private httpClient: HttpClient, public sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.pingFlowiseAPI();
  }

  ngAfterViewInit() {
    this.messageElements.changes.subscribe(() =>
      this.messageHistoryElement.nativeElement.scrollTo({ top: this.messageHistoryElement.nativeElement.scrollHeight, behavior: 'smooth' })
    );
  }

  async onMessageSendClicked() {
    this.awaitingAPIResponse = true;
    this.showWorkingState(0);
    const response = await this.queryFlowise('https://flowise.test.115.de/api/v1/prediction/31629f13-dc8a-4ebf-8afe-ebe66382a466', {
      question: this.userInput,
      history: this.getFlowiseHistory(),
    });
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

  onRefreshClicked() {
    this.chatbotSession = this.getUserGreeting();
    this.agentChain = '';
    this.userInput = '';
    this.leistung = undefined;
  }

  setMode(mode: ModeTypes) {
    if (mode !== this.mode) {
      this.mode = mode;
      this.chatbotSession = this.getUserGreeting();
      if (mode === 'mailgenerator') {
        this.chatbotSession.messages.push({ user_message: 'Bitte generiere mir eine Mail-Antwort auf folgende Anfrage:' });
      }
    }
  }

  private updateChatbotFromAPIResponse(response: FlowiseAPIResponseType) {
    this.userInput = '';
    this.chatbotSession.messages.push({ user_message: response.question, system_response: response.text });

    if (response?.agentFlowExecutedData?.length > 0) {
      this.agentChain = response.agentFlowExecutedData.map((x) => x.nodeLabel).join(' -> ');
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

  private getUserGreeting(): ChatbotSession {
    if (this.mode === 'mailgenerator') {
      return {
        messages: [
          {
            system_response: 'Hallo! Wie kann ich dir heute helfen? 😊',
            message_type: 'system_greeting',
          },
        ],
      };
    } else {
      return {
        messages: [
          {
            system_response: 'Hallo! Wie kann ich dir heute helfen? 😊',
            message_type: 'system_greeting',
          },
        ],
      };
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
