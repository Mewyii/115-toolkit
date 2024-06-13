import { Component, OnInit } from '@angular/core';
import { DateFilterFn } from '@angular/material/datepicker';
import { BehaviorSubject } from 'rxjs';
import { ConverterService, SheetDataMapping, XLSService } from 'src/app/services';

export type UserFeedback = 'good' | 'bad';

export interface BotAnswer {
  content: string;
  metadata: { mappedUserInput?: string };
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
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
})
export class ChatbotComponent implements OnInit {
  public chatbotSessions: ChatbotSessionInfo[] = [];
  public nonEmptyChatbotSessions: ChatbotSessionInfo[] = [];
  public filteredChatbotSessions: ChatbotSessionInfo[] = [];
  public verfugbarkeitsInfosAreLoading = false;

  public searchInput = 'Franken';

  public shownChatbotSessions: ChatbotSessionInfo[] = [];

  public showFullBotAnswers = false;

  public emptySessions = 0;

  public positiveUserFeedbackCount = 0;
  public negativeUserFeedbackCount = 0;

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
        date: entry.Date ? new Date(entry.Date) : undefined,
        userInput: entry.Question,
        userFeedback: entry['User Like'] != undefined ? (entry['User Like'] === true ? 'good' : 'bad') : undefined,
        userFeedbackText: entry['User Feedback'],
        botAnswer: entry['Member Answer'] ? JSON.parse(entry['Member Answer'])[0] : undefined,
        isUserSelectAction: !!entry['Mapped Action'],
      }),
    },
  ];

  private inputChangeSubject = new BehaviorSubject<string>('');
  public inputChange$ = this.inputChangeSubject.asObservable();

  constructor(public xlsService: XLSService, public converterService: ConverterService) {}

  ngOnInit(): void {}

  async onStammdatenExcelFileSelected(event: Event) {
    this.verfugbarkeitsInfosAreLoading = true;

    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    const workbookData = await this.xlsService.readFile(file);

    const chatbotInfos = await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.sheetMapping);

    const result: ChatbotSessionInfo[] = [];
    let emptySessionCount = 0;
    let positiveUserFeedbackCount = 0;
    let negativeUserFeedbackCount = 0;
    for (const chatbotInfo of chatbotInfos) {
      const entry = result.find((x) => x.sessionId === chatbotInfo.sessionId);
      if (entry) {
        if (entry.isEmptySession) {
          if (chatbotInfo.userInput !== 'startSession' && chatbotInfo.userInput !== 'closeChatBot' && chatbotInfo.userInput !== 'closeChatbot') {
            entry.isEmptySession = false;
            emptySessionCount--;
          }
        }

        entry.infos.push(chatbotInfo);
      } else {
        result.push({ sessionId: chatbotInfo.sessionId ?? 0, date: chatbotInfo.date ?? new Date(), infos: [chatbotInfo], isEmptySession: true });
        emptySessionCount++;
      }

      if (chatbotInfo.userFeedback === 'good') {
        positiveUserFeedbackCount++;
      }
      if (chatbotInfo.userFeedback === 'bad') {
        negativeUserFeedbackCount++;
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

    this.positiveUserFeedbackCount = positiveUserFeedbackCount;
    this.negativeUserFeedbackCount = negativeUserFeedbackCount;
    this.emptySessions = emptySessionCount;

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
  }

  onDateFilterChanged(event: any) {
    const pickedDate = event.value;
    this.dateFilter = pickedDate;
    this.filterSessions();
  }

  filterSessions() {
    if (this.dateFilter) {
      this.filteredChatbotSessions = this.nonEmptyChatbotSessions.filter((x) => x.date.getDate() === this.dateFilter!.getDate());
      this.showPage(1);
    } else {
      this.filteredChatbotSessions = this.nonEmptyChatbotSessions;
      this.showPage(1);
    }
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
}
