import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, catchError, map, Observable, of, startWith } from 'rxjs';
import { DataState } from './enum/data-state.enum';
import { Status } from './enum/status.enum';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { Server } from './interface/server';
import { NotificationService } from './service/notification.service';
import { ServerService } from './service/server.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  
  title = 'server-app-frontend';
  appState$: Observable<AppState<CustomResponse>>;
  readonly DataState = DataState;
  readonly Status = Status;
  private filterSubject = new BehaviorSubject<string>("");
  private dataSubject = new BehaviorSubject<CustomResponse>(null);
  filterStatus$ = this.filterSubject.asObservable();
  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  constructor(private serverService: ServerService, private notifier: NotificationService) {

  }

  ngOnInit(): void {
    this.appState$ = this.serverService.servers$
    .pipe(
      map(response => {
        this.dataSubject.next(response);
        this.notifier.onDefault(response.message);
        return { dataState: DataState.LOADED_STATE, appData: {...response, data: { servers: response.data.servers.reverse() } } }
      }),
      startWith({
        dataState: DataState.LOADING_STATE,
      }),
      catchError((err: string) => {
        return of({
          dataState: DataState.ERROR_STATE,
          error: err
        })
      })
    )
  }

  pingServer(ipAddress: string): void {
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress)
    .pipe(
      map(response => {
        const index = this.dataSubject.value.data.servers.findIndex(server => server.id === response.data.server.id);
        this.dataSubject.value.data.servers[index] = response.data.server; // find the server that the backend is changing and update
        this.filterSubject.next("");
        return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
      }),
      startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
      catchError((err: string) => {
        this.filterSubject.next("");
        return of({ dataState: DataState.ERROR_STATE, error: err })
      })
    )
  }

  filter(status: any): void {
    console.log(status);
    this.appState$ = this.serverService.filter$(<Status>status, this.dataSubject.value)
    .pipe(
      map(response => {
        return { dataState: DataState.LOADED_STATE, appData: response }
      }),
      startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
      catchError((err: string) => {
        return of({ dataState: DataState.ERROR_STATE, error: err })
      })
    )
  }

  saveServer(serverForm: NgForm): void {
    this.isLoading.next(true);
    this.appState$ = this.serverService.save$(serverForm.value as Server)
    .pipe(
      map(response => {
        this.dataSubject.next({
          ...response, data: {servers: [response.data.server, ...this.dataSubject.value.data.servers]}
        });
        document.getElementById("closeModal").click();
        this.isLoading.next(false);
        serverForm.resetForm({ status: this.Status.SERVER_DOWN });
        return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
      }),
      startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
      catchError((err: string) => {
        this.isLoading.next(false);
        return of({ dataState: DataState.ERROR_STATE, error: err })
      })
    )
  }

  deleteServer(server: Server): void {
    this.appState$ = this.serverService.delete$(server.id)
    .pipe(
      map(response => {
        this.dataSubject.next(
          { ...response, data: 
            { servers: this.dataSubject.value.data.servers.filter(s => s.id !== server.id) }}
        );
        return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
      }),
      startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
      catchError((err: string) => {
        return of({ dataState: DataState.ERROR_STATE, error: err })
      })
    )
  }

  printReport(): void {
    window.print();
    // let dataType = "application/vnd.ms-excel.sheet.macroEnable.12";
    // let tableSelect = document.getElementById("servers");
    // let tableHTML = tableSelect.outerHTML.replace(/ /g, "%20");
    // let downloadLink = document.createElement("a");
    // document.body.appendChild(downloadLink);
    // downloadLink.href = "data:" + dataType + ", " + tableHTML;
    // downloadLink.download = "server-report.xls";
    // downloadLink.click();
    // document.body.removeChild(downloadLink);
  }

}
