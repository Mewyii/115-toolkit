import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, debounceTime } from 'rxjs';
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

  public verfugbarkeitsInfosAreLoading = false;

  public searchInput = 'Franken';

  public shownchatbotInfos: ChatbotInfo[] = [];

  public botAnswerMaxHeight = 4;

  public emptySessions = 0;

  public positiveUserFeedbackCount = 0;
  public negativeUserFeedbackCount = 0;

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
      }),
    },
  ];

  private inputChangeSubject = new BehaviorSubject<string>('');
  public inputChange$ = this.inputChangeSubject.asObservable();

  constructor(public xlsService: XLSService, public converterService: ConverterService) {}

  ngOnInit(): void {
    this.inputChange$.pipe(debounceTime(750)).subscribe((x) => {
      this.filterShownInfos(x);
    });
  }

  async onStammdatenExcelFileSelected(event: Event) {
    this.verfugbarkeitsInfosAreLoading = true;

    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    const workbookData = await this.xlsService.readFile(file);

    const getId = (item: ChatbotInfo) => (item.sessionId ?? 0) + (item.questionId ?? 0) + (item.dialogId ?? 0) + '' + item.date?.toUTCString();

    const chatbotInfos = await this.xlsService.convertWorkbookDataToCustomData(workbookData, this.sheetMapping, getId);

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
    }

    this.chatbotSessions = result;

    this.positiveUserFeedbackCount = positiveUserFeedbackCount;
    this.negativeUserFeedbackCount = negativeUserFeedbackCount;
    this.emptySessions = emptySessionCount;

    this.verfugbarkeitsInfosAreLoading = false;

    this.inputChangeSubject.next(this.searchInput);
  }

  onSearchInputChange(inputEvent: any) {
    const input = inputEvent.target.value as string;

    this.inputChangeSubject.next(input);
  }

  private filterShownInfos(input: string) {
    const lowerCaseInput = input.toLocaleLowerCase();
    // this.shownchatbotInfos = this.chatbotInfos.filter((x) => x.Name.toLocaleLowerCase().includes(lowerCaseInput));
  }
}
