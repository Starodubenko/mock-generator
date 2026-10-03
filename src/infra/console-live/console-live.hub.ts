import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { WebSocketServer, type WebSocket } from 'ws';
import {
  ConsoleLiveChannel,
  type ConsoleLiveJobEvent,
} from '@entities/console-live/console-live.contract';
import { rememberLatestConsoleLiveEvent } from '@entities/console-live/remember-latest-console-live-event';
import { serializeConsoleLiveEvent } from '@entities/console-live/parse-console-live-event';
import { ConsoleLivePort } from '@repositories/console-live.port';
import { canAcceptConsoleLiveUpgrade } from './can-accept-console-live-upgrade';
import { isConsoleLivePath } from './is-console-live-path';

type EmitFn = (event: string, ...args: unknown[]) => boolean;

const HEARTBEAT_MS = 25_000;

@Injectable()
export class ConsoleLiveHub
  extends ConsoleLivePort
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(ConsoleLiveHub.name);
  private server: WebSocketServer | null = null;
  private readonly sockets = new Set<WebSocket>();
  private readonly latestByJob = new Map<string, ConsoleLiveJobEvent>();
  private readonly heartbeats = new Map<
    WebSocket,
    ReturnType<typeof setInterval>
  >();
  private restoreEmit: (() => void) | null = null;

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {
    super();
  }

  onApplicationBootstrap(): void {
    const httpServer = this.httpAdapterHost.httpAdapter.getHttpServer() as {
      emit: EmitFn;
    };
    this.server = new WebSocketServer({ noServer: true });
    this.server.on('connection', (socket) => {
      this.sockets.add(socket);
      this.replay(socket);
      const beat = setInterval(() => {
        if (socket.readyState === socket.OPEN) {
          socket.ping();
        }
      }, HEARTBEAT_MS);
      this.heartbeats.set(socket, beat);
      socket.on('close', () => {
        const timer = this.heartbeats.get(socket);
        if (timer) {
          clearInterval(timer);
        }
        this.heartbeats.delete(socket);
        this.sockets.delete(socket);
      });
    });
    const originalEmit = httpServer.emit.bind(httpServer);
    httpServer.emit = (event: string, ...args: unknown[]) => {
      if (event === 'upgrade' && this.acceptLiveUpgrade(args)) {
        return true;
      }
      return originalEmit(event, ...args);
    };
    this.restoreEmit = () => {
      httpServer.emit = originalEmit;
    };
    this.logger.log(
      `Console live WebSocket attached at ${ConsoleLiveChannel.Path}`,
    );
  }

  onApplicationShutdown(): void {
    for (const timer of this.heartbeats.values()) {
      clearInterval(timer);
    }
    this.heartbeats.clear();
    for (const socket of this.sockets) {
      socket.close();
    }
    this.sockets.clear();
    this.server?.close();
    this.server = null;
    this.restoreEmit?.();
    this.restoreEmit = null;
  }

  publish(event: ConsoleLiveJobEvent): void {
    rememberLatestConsoleLiveEvent(this.latestByJob, event);
    const payload = serializeConsoleLiveEvent(event);
    for (const socket of this.sockets) {
      if (socket.readyState === socket.OPEN) {
        socket.send(payload);
      }
    }
  }

  private replay(socket: WebSocket): void {
    for (const event of this.latestByJob.values()) {
      if (socket.readyState === socket.OPEN) {
        socket.send(serializeConsoleLiveEvent(event));
      }
    }
  }

  private acceptLiveUpgrade(args: unknown[]): boolean {
    const request = args[0] as IncomingMessage | undefined;
    const socket = args[1] as Duplex | undefined;
    const head = (args[2] as Buffer | undefined) ?? Buffer.alloc(0);
    if (!request || !socket || !isConsoleLivePath(request.url ?? '')) {
      return false;
    }
    const sessionRequired = process.env.CONSOLE_SESSION_REQUIRED !== 'false';
    if (!canAcceptConsoleLiveUpgrade(request.headers.cookie, sessionRequired)) {
      socket.destroy();
      return true;
    }
    this.server?.handleUpgrade(request, socket, head, (ws) => {
      this.server?.emit('connection', ws, request);
    });
    return true;
  }
}
