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
  startTime: string;
  endTime: string;
  isEmptySession: boolean;
  infos: ChatbotInfo[];
  hasPositiveFeedback?: boolean;
  hasNegativeFeedback?: boolean;
  isGerman?: boolean;
  isEnglish?: boolean;
  isFrench?: boolean;
  sources: Source[];
}

interface Source {
  id: string;
  name: string;
  sessionCount: number;
  totalCount: number;
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

  public emptySessionCount = 0;

  public sessionCount = 0;
  public positiveUserFeedbackCount = 0;
  public negativeUserFeedbackCount = 0;
  public germanSessionsCount = 0;
  public englishSessionsCount = 0;
  public frenchSessionsCount = 0;
  public sources: Source[] = [];
  public aiResponsesCount: { responses: number; count: number }[] = [];
  public aiResponsesAverage: string | undefined;
  public sessionTimes: { time: string; count: number }[] = [];
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
      datasets: [{ data: [0, 0, 0], label: 'Anzahl Sessions' }],
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
      datasets: [{ data: [0], label: 'Anzahl Sessions' }],
    },
  };

  lengthChart = {
    type: 'bar' as any,
    options: {
      responsive: true,
      scales: { x: {}, y: { beginAtZero: true } },
    },
    data: {
      labels: ['-'],
      datasets: [{ data: [0], label: 'Anzahl Sessions' }],
    },
  };

  timeChart = {
    type: 'bar' as any,
    options: {
      responsive: true,
      scales: { x: {}, y: { beginAtZero: true } },
    },
    data: {
      labels: [
        '1:00',
        '2:00',
        '3:00',
        '4:00',
        '5:00',
        '6:00',
        '7:00',
        '8:00',
        '9:00',
        '10:00',
        '11:00',
        '12:00',
        '13:00',
        '14:00',
        '15:00',
        '16:00',
        '17:00',
        '18:00',
        '19:00',
        '20:00',
        '21:00',
        '22:00',
        '23:00',
        '0:00',
      ],
      datasets: [{ data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], label: 'Anzahl Sessions' }],
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
          }
        }
        if (chatbotInfo.userFeedback === 'good') {
          entry.hasPositiveFeedback = true;
        }
        if (chatbotInfo.userFeedback === 'bad') {
          entry.hasNegativeFeedback = true;
        }
        if (answer.includes('<b>Hallo!</b> Ich bin der KI-Chatbot') || answer.includes(' du ') || answer.includes(' um ')) {
          entry.isGerman = true;
        }
        if (answer.includes('<b>Hello!</b> I am the AI chatbot') || answer.includes(' you ') || answer.includes(' to ')) {
          entry.isEnglish = true;
        }
        if (answer.includes('<b>Bonjour!</b> Je suis') || answer.includes(' tu ') || answer.includes(' pour ')) {
          entry.isFrench = true;
        }

        for (const extractedSource of extractSources(answer)) {
          const existingSource = entry.sources.find((x) => x.id === extractedSource.id);
          if (existingSource) {
            existingSource.totalCount++;
          } else {
            entry.sources.push({ id: extractedSource.id, name: extractedSource.name, sessionCount: 1, totalCount: 1 });
          }
        }

        entry.infos.push(chatbotInfo);
      } else {
        const sessionDate = chatbotInfo.date ?? new Date();
        const sessionTime = `${sessionDate.getHours()}:00`;

        const newEntry: ChatbotSessionInfo = {
          sessionId: chatbotInfo.sessionId ?? 0,
          date: sessionDate,
          startTime: sessionTime,
          endTime: sessionTime,
          infos: [chatbotInfo],
          isEmptySession: true,
          sources: [],
        };
        if (chatbotInfo.userFeedback === 'good') {
          newEntry.hasPositiveFeedback = true;
        }
        if (chatbotInfo.userFeedback === 'bad') {
          newEntry.hasNegativeFeedback = true;
        }
        if (answer.includes('<b>Hallo!</b> Ich bin der KI-Chatbot der Behördennummer 115')) {
          newEntry.isGerman = true;
        }
        if (answer.includes('<b>Hello!</b> I am the AI chatbot')) {
          newEntry.isEnglish = true;
        }
        if (answer.includes('<b>Bonjour!</b> Je suis')) {
          newEntry.isFrench = true;
        }

        newEntry.sources = extractSources(answer).map((source) => {
          return { id: source.id, name: source.name, sessionCount: 1, totalCount: 1 };
        });

        result.push(newEntry);
      }

      if (!this.earliestDate || (chatbotInfo.date && chatbotInfo.date < this.earliestDate)) {
        this.earliestDate = chatbotInfo.date;
      }
      if (!this.latestDate || (chatbotInfo.date && chatbotInfo.date > this.latestDate)) {
        this.latestDate = chatbotInfo.date;
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

  onDownloadSourcesAsCSVClicked() {
    // Prepare CSV header
    const header = ['ID', 'Name', 'SessionCount', 'TotalCount'];
    // Map sources to CSV rows
    const rows = this.sources.map((source) => [source.id, source.name, source.sessionCount, source.totalCount]);
    // Build CSV string
    const csvContent = [header, ...rows].map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}`).join(',')).join('\r\n');

    // Create Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sources.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  filterSessions() {
    this.sessionCount = this.chatbotSessions.filter((x) => {
      let result = true;
      if (this.dateFilter && result === true) {
        result = x.date.getDate() === this.dateFilter.getDate();
      }
      if (this.showOnlySessionsWithFeedback && result === true) {
        result = x.infos.some((x) => x.userFeedback);
      }
      return result;
    }).length;

    let sessions = this.nonEmptyChatbotSessions.filter((x) => {
      let result = true;
      if (this.dateFilter && result === true) {
        result = x.date.getDate() === this.dateFilter.getDate();
      }
      if (this.showOnlySessionsWithFeedback && result === true) {
        result = x.infos.some((x) => x.userFeedback);
      }
      return result;
    });
    this.filteredChatbotSessions = sessions;
    this.showPage(1);

    this.updateSessionMetaData();
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

  updateSessionMetaData() {
    let positiveUserFeedbackCount = 0;
    let negativeUserFeedbackCount = 0;
    let germanSessionsCount = 0;
    let englishSessionsCount = 0;
    let frenchSessionsCount = 0;
    let emptySessionCount = 0;
    const sources: Source[] = [];
    const aiResponsesCount: { responses: number; count: number }[] = [];
    const sessionTimes: { time: string; count: number }[] = [
      { time: '1:00', count: 0 },
      { time: '2:00', count: 0 },
      { time: '3:00', count: 0 },
      { time: '4:00', count: 0 },
      { time: '5:00', count: 0 },
      { time: '6:00', count: 0 },
      { time: '7:00', count: 0 },
      { time: '8:00', count: 0 },
      { time: '9:00', count: 0 },
      { time: '10:00', count: 0 },
      { time: '11:00', count: 0 },
      { time: '12:00', count: 0 },
      { time: '13:00', count: 0 },
      { time: '14:00', count: 0 },
      { time: '15:00', count: 0 },
      { time: '16:00', count: 0 },
      { time: '17:00', count: 0 },
      { time: '18:00', count: 0 },
      { time: '19:00', count: 0 },
      { time: '20:00', count: 0 },
      { time: '21:00', count: 0 },
      { time: '22:00', count: 0 },
      { time: '23:00', count: 0 },
      { time: '0:00', count: 0 },
    ];

    for (const session of this.filteredChatbotSessions) {
      if (session.hasPositiveFeedback) {
        positiveUserFeedbackCount++;
      }
      if (session.hasNegativeFeedback) {
        negativeUserFeedbackCount++;
      }
      if (!session.isEmptySession && session.isGerman) {
        germanSessionsCount++;
      }
      if (!session.isEmptySession && session.isEnglish) {
        englishSessionsCount++;
      }
      if (!session.isEmptySession && session.isFrench) {
        frenchSessionsCount++;
      }
      if (session.isEmptySession) {
        emptySessionCount++;
      }
      for (const source of session.sources) {
        const existingSource = sources.find((x) => x.id === source.id);
        if (existingSource) {
          existingSource.sessionCount++;
          existingSource.totalCount += source.totalCount;
        } else {
          sources.push({ id: source.id, name: source.name, sessionCount: source.sessionCount, totalCount: source.totalCount });
        }
      }

      if (session.infos.length > 0) {
        const aiResponses = session.infos.filter((x) => x.botAnswer && x.botAnswer.content && x.botAnswer.content.length > 0).length - 1; // -1 Because first message is the automated greeting;
        const existingAiResponsesEntry = aiResponsesCount.find((x) => x.responses === aiResponses);
        if (existingAiResponsesEntry) {
          existingAiResponsesEntry.count++;
        } else {
          aiResponsesCount.push({ responses: aiResponses, count: 1 });
        }
      }

      const sessionTime = sessionTimes.find((x) => x.time === session.startTime);
      if (sessionTime) {
        sessionTime.count++;
      }
    }

    this.positiveUserFeedbackCount = positiveUserFeedbackCount;
    this.negativeUserFeedbackCount = negativeUserFeedbackCount;
    this.emptySessionCount = emptySessionCount;

    this.germanSessionsCount = germanSessionsCount;
    this.englishSessionsCount = englishSessionsCount;
    this.frenchSessionsCount = frenchSessionsCount;
    this.sources = sources.sort((a, b) => b.sessionCount - a.sessionCount);
    this.aiResponsesCount = aiResponsesCount.sort((a, b) => a.responses - b.responses);
    this.sessionTimes = sessionTimes;

    this.updateChartData();
  }

  updateChartData() {
    this.languageChart.data = {
      labels: ['Deutsch', 'Englisch', 'Französisch'],
      datasets: [{ data: [this.germanSessionsCount, this.englishSessionsCount, this.frenchSessionsCount], label: 'Anzahl Sessions' }],
    };

    const sourceLabels = this.sources.map((x) => x.name);
    const sourceCounts = this.sources.map((x) => x.sessionCount);
    this.contentChart.data = {
      labels: sourceLabels,
      datasets: [{ data: sourceCounts, label: 'Anzahl Sessions' }],
    };

    this.lengthChart.data = {
      labels: this.aiResponsesCount.map((x) => x.responses.toString()),
      datasets: [{ data: this.aiResponsesCount.map((x) => x.count), label: 'Anzahl Sessions' }],
    };

    this.aiResponsesAverage = (this.aiResponsesCount.reduce((sum, entry) => sum + entry.responses * entry.count, 0) / this.filteredChatbotSessions.length).toFixed(1);

    this.timeChart.data = {
      labels: this.sessionTimes.map((x) => x.time),
      datasets: [{ data: this.sessionTimes.map((x) => x.count), label: 'Anzahl Sessions' }],
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
