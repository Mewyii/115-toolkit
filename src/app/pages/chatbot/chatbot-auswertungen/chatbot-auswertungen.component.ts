import { Component, OnInit } from '@angular/core';
import { isArray, startsWith } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { ConverterService, SheetDataMapping, XLSService } from 'src/app/services';

export type UserFeedback = 'good' | 'bad';

export interface BotAnswer {
  content: string;
  metadata: { mappedUserInput?: string; messageType?: any };
}

export interface ChatbotInfo {
  sessionId?: number;
  questionId?: number;
  dialogId?: number;
  date?: Date;
  userInput: string;
  userFeedback?: UserFeedback;
  userFeedbackText?: string;
  botAnswer?: BotAnswer;
  isUserSelectAction?: boolean;
}

export interface ChatbotSessionInfo {
  sessionId: number;
  date: Date;
  isEmptySession: boolean;
  infos: ChatbotInfo[];
  hasPositiveFeedback?: boolean;
  hasNegativeFeedback?: boolean;
  isGerman?: boolean;
  isEnglish?: boolean;
  isFrench?: boolean;
}

interface Source {
  id: string;
  name: string;
  count: number;
}

@Component({
  selector: 'app-chatbot-auswertungen',
  templateUrl: './chatbot-auswertungen.component.html',
  styleUrls: ['./chatbot-auswertungen.component.scss'],
  standalone: false,
})
export class ChatbotAuswertungenComponent implements OnInit {
  public chatbotSessions: ChatbotSessionInfo[] = [];
  public nonEmptyChatbotSessions: ChatbotSessionInfo[] = [];
  public filteredChatbotSessions: ChatbotSessionInfo[] = [];
  public verfugbarkeitsInfosAreLoading = false;

  public searchInput = 'Franken';

  public shownChatbotSessions: ChatbotSessionInfo[] = [];

  public emptySessions = 0;

  public positiveUserFeedbackCount = 0;
  public negativeUserFeedbackCount = 0;
  public germanSessionsCount = 0;
  public englishSessionsCount = 0;
  public frenchSessionsCount = 0;
  public sources: Source[] = [];

  public earliestDate: Date | undefined;
  public latestDate: Date | undefined;

  public page = 1;
  public pageSize = 10;

  public dateFilter: Date | undefined;

  private sheetMapping: SheetDataMapping<ChatbotInfo>[] = [
    {
      name: 'Sheet1',
      mappingFunction: (entry) => ({
        sessionId: entry['Protocol Session'],
        questionId: entry['Question Session'],
        dialogId: entry['Dialog Session'],
        date: entry.Date ? excelDateToJSDate(entry.Date) : undefined,
        userInput: entry.Question,
        userFeedback: entry['User Like'] != undefined ? (entry['User Like'] === 'true' ? 'good' : 'bad') : undefined,
        userFeedbackText: entry['User Feedback'],
        botAnswer: entry['Member Answer']
          ? JSON.parse(entry['Member Answer'])[0]
          : entry['Mapped Action'] && startsWith(entry['Mapped Action'], '[{') && isArray(JSON.parse(entry['Mapped Action']))
          ? JSON.parse(entry['Mapped Action'])[0]
          : undefined,
        isUserSelectAction: !!entry['Mapped Action'] && !startsWith(entry['Mapped Action'], '[{'),
      }),
    },
  ];

  private inputChangeSubject = new BehaviorSubject<string>('');
  public inputChange$ = this.inputChangeSubject.asObservable();

  public showOnlySessionsWithFeedback = false;

  // Analytics
  sourceRegexp = /<small>\s*Quelle\(n\):\s*<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>\s*<\/small>/is;

  languageChart = {
    type: 'bar' as any,
    options: {
      responsive: true,
      scales: { x: {}, y: { beginAtZero: true } },
    },
    data: {
      labels: ['Deutsch', 'Englisch', 'Französisch'],
      datasets: [{ data: [0, 0, 0], label: 'Sessions' }],
    },
  };

  contentChart = {
    type: 'doughnut' as any,
    options: {
      responsive: true,
      scales: { x: {}, y: {} },
    },
    data: {
      labels: ['-'],
      datasets: [{ data: [0], label: 'Ausgaben' }],
    },
  };

  constructor(public xlsService: XLSService, public converterService: ConverterService) {}

  ngOnInit(): void {}

  async onStammdatenExcelFileSelected(event: Event) {
    this.verfugbarkeitsInfosAreLoading = true;

    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    const workbookData = await this.xlsService.readFile(file, { firstLinesToSkip: 1 });

    const chatbotInfos = await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.sheetMapping);

    const result: ChatbotSessionInfo[] = [];
    let emptySessionCount = 0;
    const sources: Source[] = [];
    for (const chatbotInfo of chatbotInfos) {
      const entry = result.find((x) => x.sessionId === chatbotInfo.sessionId);
      const answer = chatbotInfo.botAnswer?.content ?? '';
      if (entry) {
        if (entry.isEmptySession) {
          if (
            chatbotInfo.userInput !== 'startSession' &&
            chatbotInfo.userInput !== 'closeChatBot' &&
            chatbotInfo.userInput !== 'closeChatbot' &&
            chatbotInfo.userInput !== 'hideWidget'
          ) {
            entry.isEmptySession = false;
            emptySessionCount--;
          }
        }
        if (chatbotInfo.userFeedback === 'good') {
          entry.hasPositiveFeedback = true;
        }
        if (chatbotInfo.userFeedback === 'bad') {
          entry.hasNegativeFeedback = true;
        }
        if (answer.includes('<b>Hallo!</b> Ich bin der KI-Chatbot der Behördennummer 115')) {
          entry.isGerman = true;
        }
        if (answer.includes('<b>Hello!</b> I am the AI chatbot for the public service number 115')) {
          entry.isEnglish = true;
        }
        if (answer.includes('<b>Bonjour!</b> Je suis')) {
          entry.isFrench = true;
        }

        extractSources(answer).map((source) => {
          const existingSource = sources.find((x) => x.id === source.id);
          if (existingSource) {
            existingSource.count++;
          } else {
            sources.push({ id: source.id, name: source.name, count: 1 });
          }
        });

        entry.infos.push(chatbotInfo);
      } else {
        const newEntry: ChatbotSessionInfo = { sessionId: chatbotInfo.sessionId ?? 0, date: chatbotInfo.date ?? new Date(), infos: [chatbotInfo], isEmptySession: true };
        if (chatbotInfo.userFeedback === 'good') {
          newEntry.hasPositiveFeedback = true;
        }
        if (chatbotInfo.userFeedback === 'bad') {
          newEntry.hasNegativeFeedback = true;
        }
        if (answer.includes('<b>Hallo!</b> Ich bin der KI-Chatbot der Behördennummer 115')) {
          newEntry.isGerman = true;
        }
        if (answer.includes('<b>Hello!</b> I am the AI chatbot for the public service number 115')) {
          newEntry.isEnglish = true;
        }
        if (answer.includes('<b>Bonjour!</b> Je suis')) {
          newEntry.isFrench = true;
        }

        extractSources(answer).map((source) => {
          const existingSource = sources.find((x) => x.id === source.id);
          if (existingSource) {
            existingSource.count++;
          } else {
            sources.push({ id: source.id, name: source.name, count: 1 });
          }
        });

        result.push(newEntry);
        emptySessionCount++;
      }

      if (!this.earliestDate || (chatbotInfo.date && chatbotInfo.date < this.earliestDate)) {
        this.earliestDate = chatbotInfo.date;
      }
      if (!this.latestDate || (chatbotInfo.date && chatbotInfo.date > this.latestDate)) {
        this.latestDate = chatbotInfo.date;
      }
    }

    let positiveUserFeedbackCount = 0;
    let negativeUserFeedbackCount = 0;
    let germanSessionsCount = 0;
    let englishSessionsCount = 0;
    let frenchSessionsCount = 0;

    for (const entry of result) {
      if (entry.hasPositiveFeedback) {
        positiveUserFeedbackCount++;
      }
      if (entry.hasNegativeFeedback) {
        negativeUserFeedbackCount++;
      }
      if (entry.isGerman) {
        germanSessionsCount++;
      }
      if (entry.isEnglish) {
        englishSessionsCount++;
      }
      if (entry.isFrench) {
        frenchSessionsCount++;
      }
    }

    if (this.earliestDate) {
      this.earliestDate.setHours(0, 0, 0, 0);
    }
    if (this.latestDate) {
      this.latestDate.setHours(0, 0, 0, 0);
    }
    this.chatbotSessions = result;
    this.nonEmptyChatbotSessions = result.filter((x) => !x.isEmptySession);

    this.positiveUserFeedbackCount = positiveUserFeedbackCount;
    this.negativeUserFeedbackCount = negativeUserFeedbackCount;
    this.emptySessions = emptySessionCount;

    this.germanSessionsCount = germanSessionsCount;
    this.englishSessionsCount = englishSessionsCount;
    this.frenchSessionsCount = frenchSessionsCount;

    this.sources = sources.sort((a, b) => b.count - a.count);

    this.updateChartData();

    this.filterSessions();
    this.showPage(this.page);

    this.verfugbarkeitsInfosAreLoading = false;
    input.value = '';
  }

  onSearchInputChange(inputEvent: any) {
    const input = inputEvent.target.value as string;

    this.inputChangeSubject.next(input);
  }

  onShowPreviousPageClicked() {
    this.showPage(this.page - 1);
  }

  onShowNextPageClicked() {
    this.showPage(this.page + 1);
    window.scrollTo({ top: 0 });
  }

  onDateFilterChanged(event: any) {
    const pickedDate = event.value;
    this.dateFilter = pickedDate;
    this.filterSessions();
  }

  filterSessions() {
    let sessions = this.nonEmptyChatbotSessions;
    if (this.dateFilter) {
      sessions = sessions.filter((x) => x.date.getDate() === this.dateFilter!.getDate());
    }
    if (this.showOnlySessionsWithFeedback) {
      sessions = sessions.filter((x) => x.infos.some((x) => x.userFeedback));
    }
    this.filteredChatbotSessions = sessions;
    this.showPage(1);
  }

  private showPage(page: number) {
    this.page = page;
    this.shownChatbotSessions = this.filteredChatbotSessions.slice((this.page - 1) * this.pageSize, this.page * this.pageSize);
  }

  datePickerFilter = (date: Date | null) => {
    if (date) {
      if (this.earliestDate && date >= this.earliestDate && this.latestDate && date <= this.latestDate) {
        return true;
      }
      return false;
    } else {
      return true;
    }
  };

  updateChartData() {
    this.languageChart.data = {
      labels: ['Deutsch', 'Englisch', 'Französisch'],
      datasets: [{ data: [this.germanSessionsCount, this.englishSessionsCount, this.frenchSessionsCount], label: 'Sessions' }],
    };

    const sourceLabels = this.sources.map((x) => x.name);
    const sourceCounts = this.sources.map((x) => x.count);
    this.contentChart.data = {
      labels: sourceLabels,
      datasets: [{ data: sourceCounts, label: 'Ausgaben' }],
    };
  }
}

function excelDateToJSDate(serial: number): Date {
  const excelEpoch = new Date(1899, 11, 30); // Excel day 1 = 1900-01-01, also -2 Tage
  const millisPerDay = 24 * 60 * 60 * 1000;
  return new Date(excelEpoch.getTime() + serial * millisPerDay);
}

function extractSources(html: string) {
  const blockMatch = html.match(/<small[^>]*>\s*Quelle\(n\):(.*?)<\/small>/is);
  if (!blockMatch) return [];

  const inner = blockMatch[1];

  const linkRegex = /<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
  const sources = [];
  let m;
  while ((m = linkRegex.exec(inner)) !== null) {
    sources.push({ id: m[1], name: m[2].trim() });
  }

  return sources;
}
