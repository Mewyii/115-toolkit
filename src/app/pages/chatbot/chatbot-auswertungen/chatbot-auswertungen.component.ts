import { Component, OnInit } from '@angular/core';
import { isArray, startsWith } from 'lodash';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ConverterService, SheetDataMapping, XLSService } from 'src/app/services';
import { LeikasService } from './services/leikas.service';

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
  sourceCategory: 'leistung' | 'website' | 'beides' | 'keine';
  sessionLength: number;
}

interface Source {
  id: string;
  name: string;
  category: 'leistung' | 'website';
  sessionCount: number;
  totalCount: number;
}

@Component({
  selector: 'app-chatbot-auswertungen',
  templateUrl: './chatbot-auswertungen.component.html',
  styleUrls: ['./chatbot-auswertungen.component.scss'],
  standalone: false,
  providers: [LeikasService],
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
  public dailySessions: { date: string; count: number }[] = [];
  public earliestDate: Date | undefined;
  public latestDate: Date | undefined;
  public languageFilter = '';
  public languages: { name: string; count: number }[] = [
    { name: 'Deutsch', count: 0 },
    { name: 'Englisch', count: 0 },
    { name: 'Französisch', count: 0 },
  ];
  public sessionLengthFilter: number | '' | '>9' = '';
  public sessionLengths: { name: string; count: number }[] = [
    { name: '0', count: 0 },
    { name: '1', count: 0 },
    { name: '2', count: 0 },
    { name: '3', count: 0 },
    { name: '4', count: 0 },
    { name: '5', count: 0 },
    { name: '6', count: 0 },
    { name: '7', count: 0 },
    { name: '8', count: 0 },
    { name: '9', count: 0 },
    { name: '>9', count: 0 },
  ];
  public sessionSourceFilter = '';
  public sessionSources: { name: string; count: number }[] = [];

  public page = 1;
  public pageSize = 10;

  public dateFilter: Date | undefined;

  private leikaData: { name: string; key: number; lage?: string; sessionCount: number }[] = [];
  private lagenData: { lage: string; code: string; sessionCount: number }[] = [];
  private mainLagenData: { lage: string; sessionCount: number }[] = [];

  public leistungsInfoBaseURL = 'https://chatbot.test.115.de/';

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

  public feedbackOptions: { value: 'off' | 'feedback' | 'positive' | 'negative' | 'text'; label: string }[] = [
    { value: 'off', label: 'Alles' },
    { value: 'feedback', label: 'Mit Feedback' },
    { value: 'positive', label: 'Nur positives Feedback' },
    { value: 'negative', label: 'Nur negatives Feedback' },
    { value: 'text', label: 'Nur Text-Feedback' },
  ];
  public feedbackFilter: 'off' | 'feedback' | 'positive' | 'negative' | 'text' = 'off';

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

  sourceOriginChart = {
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

  leikaChart = {
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

  lagenChart = {
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

  websiteSourcesChart = {
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

  lagenCategoriesChart = {
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

  dailyChart = {
    type: 'bar' as any,
    options: {
      responsive: true,
      scales: { x: {}, y: { beginAtZero: true } },
    },
    data: {
      labels: ['-'],
      datasets: [{ data: [0], label: 'Anzahl Sessions pro Tag' }],
    },
  };

  constructor(public xlsService: XLSService, public converterService: ConverterService, private leikasService: LeikasService) {}

  ngOnInit(): void {
    this.leikasService.lagen$.pipe(switchMap(() => this.leikasService.leikas$)).subscribe();
  }

  async onStammdatenExcelFileSelected(event: Event, mode: 'new' | 'add') {
    this.verfugbarkeitsInfosAreLoading = true;

    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    const workbookData = await this.xlsService.readFile(file, { firstLinesToSkip: 1 });

    const chatbotInfos = await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.sheetMapping);

    if (mode === 'new') {
      this.earliestDate = undefined;
      this.latestDate = undefined;
    }

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
            const baseURLs = this.leistungsInfoBaseURL.split(';').map((x) => x.trim());
            entry.sources.push({
              id: extractedSource.id,
              name: extractedSource.name,
              sessionCount: 1,
              totalCount: 1,
              category: baseURLs.some((url) => extractedSource.id.includes(url)) ? 'leistung' : 'website',
            });
          }
        }

        entry.sourceCategory =
          entry.sources.length === 0
            ? 'keine'
            : entry.sources.every((x) => x.category === 'leistung')
            ? 'leistung'
            : entry.sources.every((x) => x.category === 'website')
            ? 'website'
            : 'beides';

        entry.infos.push(chatbotInfo);
        if (!entry.isEmptySession) {
          entry.sessionLength = entry.infos.filter((x) => x.botAnswer && x.botAnswer.content && x.botAnswer.content.length > 0).length - 1;
        }
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
          sourceCategory: 'keine',
          sessionLength: 0,
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
          const baseURLs = this.leistungsInfoBaseURL.split(';').map((x) => x.trim());
          return { id: source.id, name: source.name, sessionCount: 1, totalCount: 1, category: baseURLs.some((url) => source.id.includes(url)) ? 'leistung' : 'website' };
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

    if (mode === 'new') {
      this.chatbotSessions = result;
    } else if (mode === 'add') {
      this.chatbotSessions = [...this.chatbotSessions, ...result];
    }
    this.nonEmptyChatbotSessions = this.chatbotSessions.filter((x) => !x.isEmptySession);

    this.languages.map((x) => (x.count = 0));
    this.sessionLengths.map((x) => (x.count = 0));
    this.sessionSources = [];

    this.chatbotSessions.map((x) => {
      if (x.isGerman) {
        const languageEntry = this.languages.find((lang) => lang.name === 'Deutsch');
        if (languageEntry) {
          languageEntry.count++;
        }
      }
      if (x.isEnglish) {
        const languageEntry = this.languages.find((lang) => lang.name === 'Englisch');
        if (languageEntry) {
          languageEntry.count++;
        }
      }
      if (x.isFrench) {
        const languageEntry = this.languages.find((lang) => lang.name === 'Französisch');
        if (languageEntry) {
          languageEntry.count++;
        }
      }
      if (x.sessionLength < 10) {
        const lengthEntry = this.sessionLengths.find((len) => len.name === x.sessionLength.toString());
        if (lengthEntry) {
          lengthEntry.count++;
        }
      } else {
        const lengthEntry = this.sessionLengths.find((len) => len.name === '>9');
        if (lengthEntry) {
          lengthEntry.count++;
        }
      }
      for (const source of x.sources) {
        const existingSource = this.sessionSources.find((s) => s.name === source.name);
        if (existingSource) {
          existingSource.count++;
        } else {
          this.sessionSources.push({ name: source.name, count: 1 });
        }
      }
      if (x.sources.length === 0) {
        const existingSource = this.sessionSources.find((s) => s.name === 'Keine');
        if (existingSource) {
          existingSource.count++;
        } else {
          this.sessionSources.push({ name: 'Keine', count: 1 });
        }
      }
    });

    this.sessionSources.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

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

  onSessionLengthFilterChanged(event: any) {
    const pickedLength = event.target.value;
    if (pickedLength === '') {
      this.sessionLengthFilter = '';
    } else if (pickedLength === '>9') {
      this.sessionLengthFilter = '>9';
    } else {
      this.sessionLengthFilter = parseInt(pickedLength, 10);
    }
    this.filterSessions();
  }

  onSessionFeedbackFilterChanged(event: any) {
    const pickedFeedback = event.target.value;
    this.feedbackFilter = pickedFeedback;
    this.filterSessions();
  }

  onSessionSourceFilterChanged(event: any) {
    const pickedSource = event.target.value;
    this.sessionSourceFilter = pickedSource;
    this.filterSessions();
  }

  onLanguageFilterChanged(event: any) {
    const pickedLanguage = event.target.value;
    this.languageFilter = pickedLanguage;
    this.filterSessions();
  }

  onDownloadSourcesAsCSVClicked() {
    const header = ['ID', 'Name', 'SessionCount', 'TotalCount'];
    const rows = this.sources.map((source) => [source.id, source.name, source.sessionCount, source.totalCount]);

    const csvContent = [header, ...rows].map((row) => row.map((field) => `${String(field).replace(/"/g, '').replace(',', ';')}`).join(',')).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Leistungsquellen.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  onDownloadLeikasAsCSVClicked() {
    const header = ['Name', 'LeikaID', 'Lage', 'SessionCount'];
    const rows = this.leikaData.map((source) => [source.name, source.key, source.lage, source.sessionCount]);

    const csvContent = [header, ...rows].map((row) => row.map((field) => `${String(field).replace(/"/g, '').replace(',', ';')}`).join(',')).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Leikas.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  onDownloadLagenAsCSVClicked() {
    const header = ['Lage', 'SessionCount'];
    const rows = this.lagenData.map((source) => [source.lage, source.sessionCount]);

    const csvContent = [header, ...rows].map((row) => row.map((field) => `${String(field).replace(/"/g, '').replace(',', ';')}`).join(',')).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Lagen.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  onDownloadWebsiteInfosAsCSVClicked() {
    const header = ['ID', 'Name', 'SessionCount'];
    const rows = this.sources.filter((x) => x.category === 'website').map((source) => [source.id, source.name, source.sessionCount]);

    const csvContent = [header, ...rows].map((row) => row.map((field) => `${String(field).replace(/"/g, '').replace(',', ';')}`).join(',')).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Webseitenquellen.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  onDownloadFilteredSessionsClicked() {
    const jsonContent = JSON.stringify(
      this.filteredChatbotSessions.map((x) => ({
        sessionId: x.sessionId,
        date: x.date,
        content: x.infos.map((x) => ({
          userinput: x.userInput,
          botAnswer: x.botAnswer?.content,
          userFeedbackForBotAnswer: x.userFeedback,
          userFeedbackText: x.userFeedbackText,
        })),
      })),
      null,
      2
    );

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Gefilterte Sessions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  onLoadLeikasClicked() {
    combineLatest([this.leikasService.lagen$, this.leikasService.leikas$]).subscribe(([allLagen, leikas]) => {
      const leistungsSources = this.sources.filter((x) => x.category === 'leistung');
      const result = leistungsSources.map((source) => {
        const leika = leikas.find((leika) => source.id.includes(leika.key.toString()));
        return leika ? { ...leika, sessionCount: source.sessionCount } : undefined;
      });

      this.leikaData = [{ name: 'Unbekannt', lage: 'Unbekannt', key: 0, sessionCount: 0 }];
      this.lagenData = [{ lage: 'Unbekannt', code: '0000000', sessionCount: 0 }];

      for (const entry of result) {
        if (entry) {
          const existingLeikaEntry = this.leikaData.find((x) => x.key === entry.key);
          if (existingLeikaEntry) {
            existingLeikaEntry.sessionCount += entry.sessionCount;
          } else {
            this.leikaData.push({ name: entry.name, key: entry.key, lage: entry.lage, sessionCount: entry.sessionCount });
          }

          if (entry.lage && entry.lageCode) {
            const subLagen = entry.lage.split('|').map((x) => x.trim());
            const subLagenCodes = entry.lageCode.split('|').map((x) => x.trim());
            for (const [index, lage] of subLagen.entries()) {
              const existingLagenEntry = this.lagenData.find((x) => x.lage === lage);
              if (existingLagenEntry) {
                existingLagenEntry.sessionCount += entry.sessionCount;
              } else {
                this.lagenData.push({ lage: lage, code: subLagenCodes[index as any], sessionCount: entry.sessionCount });
              }
            }
          } else {
            this.lagenData[0].sessionCount += entry.sessionCount;
          }
        } else {
          this.leikaData[0].sessionCount += 1;
          this.lagenData[0].sessionCount += 1;
        }
      }

      this.leikaData.sort((a, b) => b.sessionCount - a.sessionCount || a.name.localeCompare(b.name));
      this.lagenData.sort((a, b) => b.sessionCount - a.sessionCount || a.lage.localeCompare(b.lage));
      this.mainLagenData.sort((a, b) => b.sessionCount - a.sessionCount || a.lage.localeCompare(b.lage));

      this.leikaChart.data = {
        labels: this.leikaData.map((x) => `${x.name} (${x.key})`),
        datasets: [{ data: this.leikaData.map((x) => x.sessionCount), label: 'Anzahl Sessions' }],
      };

      this.lagenChart.data = {
        labels: this.lagenData.map((x) => x.lage),
        datasets: [{ data: this.lagenData.map((x) => x.sessionCount), label: 'Anzahl Sessions' }],
      };

      const lagenCategoriesData = this.lagenData.reduce<{ [key: string]: number }>((acc, curr) => {
        const mainLagenCode = curr.code.substring(0, 3) + '0000';
        const mainLageEntry = allLagen.find((x) => x.code === mainLagenCode);
        if (mainLageEntry) {
          acc[mainLageEntry.description] = (acc[mainLageEntry.description] || 0) + curr.sessionCount;
        }
        return acc;
      }, {});

      this.lagenCategoriesChart.data = {
        labels: Object.keys(lagenCategoriesData),
        datasets: [{ data: Object.values(lagenCategoriesData), label: 'Anzahl Sessions' }],
      };
    });
  }

  filterSessions() {
    this.sessionCount = this.chatbotSessions.filter((x) => {
      let result = true;
      if (this.dateFilter && result === true) {
        result = x.date.getDate() === this.dateFilter.getDate();
      }
      if (this.sessionLengthFilter && result === true) {
        if (this.sessionLengthFilter === '>9') {
          result = x.sessionLength > 9;
        } else {
          result = x.sessionLength === this.sessionLengthFilter;
        }
      }
      if (this.languageFilter && result === true) {
        if (this.languageFilter === 'Deutsch') {
          result = x.isGerman === true;
        } else if (this.languageFilter === 'Englisch') {
          result = x.isEnglish === true;
        } else if (this.languageFilter === 'Französisch') {
          result = x.isFrench === true;
        }
      }
      if (this.feedbackFilter !== 'off' && result === true) {
        if (this.feedbackFilter === 'feedback') {
          result = x.infos.some((x) => x.userFeedback);
        } else if (this.feedbackFilter === 'positive') {
          result = x.infos.some((x) => x.userFeedback === 'good');
        } else if (this.feedbackFilter === 'negative') {
          result = x.infos.some((x) => x.userFeedback === 'bad');
        } else if (this.feedbackFilter === 'text') {
          result = x.infos.some((x) => x.userFeedbackText && x.userFeedbackText.length > 0);
        }
      }
      if (this.sessionSourceFilter && result === true) {
        if (this.sessionSourceFilter === 'Keine') {
          result = x.sources.length === 0;
        } else {
          result = x.sources.some((s) => s.name === this.sessionSourceFilter);
        }
      }
      return result;
    }).length;

    let sessions = this.nonEmptyChatbotSessions.filter((x) => {
      let result = true;
      if (this.dateFilter && result === true) {
        result = x.date.getDate() === this.dateFilter.getDate();
      }
      if (this.sessionLengthFilter && result === true) {
        if (this.sessionLengthFilter === '>9') {
          result = x.sessionLength > 9;
        } else {
          result = x.sessionLength === this.sessionLengthFilter;
        }
      }
      if (this.languageFilter && result === true) {
        if (this.languageFilter === 'Deutsch') {
          result = x.isGerman === true;
        } else if (this.languageFilter === 'Englisch') {
          result = x.isEnglish === true;
        } else if (this.languageFilter === 'Französisch') {
          result = x.isFrench === true;
        }
      }
      if (this.feedbackFilter !== 'off' && result === true) {
        if (this.feedbackFilter === 'feedback') {
          result = x.infos.some((x) => x.userFeedback);
        } else if (this.feedbackFilter === 'positive') {
          result = x.infos.some((x) => x.userFeedback === 'good');
        } else if (this.feedbackFilter === 'negative') {
          result = x.infos.some((x) => x.userFeedback === 'bad');
        } else if (this.feedbackFilter === 'text') {
          result = x.infos.some((x) => x.userFeedbackText && x.userFeedbackText.length > 0);
        }
      }
      if (this.sessionSourceFilter && result === true) {
        if (this.sessionSourceFilter === 'Keine') {
          result = x.sources.length === 0;
        } else {
          result = x.sources.some((s) => s.name === this.sessionSourceFilter);
        }
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
    const dailySessions: { date: string; count: number }[] = [];

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
          const baseURLs = this.leistungsInfoBaseURL.split(';').map((x) => x.trim());
          sources.push({
            id: source.id,
            name: source.name,
            sessionCount: source.sessionCount,
            totalCount: source.totalCount,
            category: baseURLs.some((url) => source.id.includes(url)) ? 'leistung' : 'website',
          });
        }
      }

      if (session.infos.length > 0) {
        const aiResponses = session.sessionLength;
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
      } else {
        sessionTimes.push({ time: session.startTime, count: 1 });
      }

      const sessionDay = session.date.toISOString().split('T')[0];
      const dailySession = dailySessions.find((x) => x.date === sessionDay);
      if (dailySession) {
        dailySession.count++;
      } else {
        dailySessions.push({ date: sessionDay, count: 1 });
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

    // Fill gaps in daily sessions
    if (this.earliestDate && this.latestDate) {
      this.dailySessions = this.fillDailySessionsGaps(dailySessions, this.earliestDate, this.latestDate);
    }

    this.updateChartData();
  }

  fillDailySessionsGaps(dailySessions: any[], startDate: Date, endDate: Date): any[] {
    const sortedDailySessions = dailySessions.sort((a, b) => a.date.localeCompare(b.date));
    const existingDates = new Set(sortedDailySessions.map((session) => session.date));

    const getLocalDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const currentDate = new Date(startDate);
    for (; currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      const dateString = getLocalDateString(currentDate);
      if (!existingDates.has(dateString)) {
        sortedDailySessions.push({ date: dateString, sessionCount: 0 });
      }
    }

    return sortedDailySessions.sort((a, b) => a.date.localeCompare(b.date));
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

    const leistungsInfoSourceCounts = this.filteredChatbotSessions.filter((x) => x.sourceCategory === 'leistung').length;
    const websiteInfoSourceCounts = this.filteredChatbotSessions.filter((x) => x.sourceCategory === 'website').length;
    const bothSourceCounts = this.filteredChatbotSessions.filter((x) => x.sourceCategory === 'beides').length;
    const noSourceCounts = this.filteredChatbotSessions.filter((x) => x.sourceCategory === 'keine').length;

    this.sourceOriginChart.data = {
      labels: ['Leistungs-Informationen', 'Website-Informationen', 'Beides', 'Keine Quellen'],
      datasets: [{ data: [leistungsInfoSourceCounts, websiteInfoSourceCounts, bothSourceCounts, noSourceCounts], label: 'Anzahl Sessions' }],
    };

    this.websiteSourcesChart.data = {
      labels: this.sources.filter((x) => x.category === 'website').map((x) => x.name),
      datasets: [{ data: this.sources.filter((x) => x.category === 'website').map((x) => x.sessionCount), label: 'Anzahl Sessions' }],
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

    this.dailyChart.data = {
      labels: this.dailySessions.map((x) => {
        const d = new Date(x.date + 'T00:00:00');
        return d.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
      }),
      datasets: [{ data: this.dailySessions.map((x) => x.count), label: 'Anzahl Sessions pro Tag' }],
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
