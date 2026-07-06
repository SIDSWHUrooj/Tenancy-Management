import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * AuthInterceptor
 * ─────────────────────────────────────────────────────────────────────────
 * Automatically attaches the Bearer token to every outgoing request that
 * targets the TY API.  On a 401 response it attempts a single token
 * refresh and replays the failed request with the new token.
 *
 * Register in app.config.ts (standalone) or AppModule:
 *
 *   // app.config.ts
 *   import { provideHttpClient, withInterceptors } from '@angular/common/http';
 *   import { authInterceptorFn } from './services/auth.interceptor';
 *
 *   export const appConfig: ApplicationConfig = {
 *     providers: [
 *       provideHttpClient(withInterceptors([authInterceptorFn]))
 *     ]
 *   };
 *
 *   // OR (class-based interceptor):
 *   providers: [
 *     { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
 *   ]
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  private readonly API_BASE = 'https://tenancyapi.siddev.online';

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only intercept requests to our TY API
    if (!req.url.startsWith(this.API_BASE)) {
      return next.handle(req);
    }

    const token = this.authService.getToken();
    const authedReq = token ? this.addToken(req, token) : req;

    return next.handle(authedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !req.url.includes('/auth/')) {
          return this.handle401(req, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  private handle401(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.isRefreshing) {
      // Wait for the ongoing refresh to complete and then retry
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => next.handle(this.addToken(req, token!)))
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.authService.refreshToken().pipe(
      switchMap(res => {
        this.isRefreshing = false;
const newToken = res.data.accessToken;        this.refreshTokenSubject.next(newToken);
        return next.handle(this.addToken(req, newToken));
      }),
      catchError(err => {
        this.isRefreshing = false;
        // If refresh itself fails, force logout
        this.authService.logout().subscribe();
        return throwError(() => err);
      })
    );
  }
}
