// WebSocket service for real-time player synchronization

export type WSEventHandler = (event: any) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private handlers: Set<WSEventHandler> = new Set();
  private sessionId: string | null = null;
  private userId: string | null = null;
  private userName: string | null = null;
  private role: string | null = null;
  private reconnectTimer: any = null;

  public connect(sessionId: string, userId: string, userName: string, role: string) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.userName = userName;
    this.role = role;

    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {}
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // handled via vite proxy or direct
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        // Authenticate into session room
        this.send({
          type: 'JOIN_SESSION',
          sessionId,
          userId,
          userName,
          role
        });
      };

      this.socket.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          this.handlers.forEach(h => h(data));
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };

      this.socket.onclose = () => {
        // Reconnect after brief pause if session is active
        if (this.sessionId) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            this.connect(sessionId, userId, userName, role);
          }, 3000);
        }
      };

      this.socket.onerror = (err) => {
        console.warn('WS error', err);
      };
    } catch (err) {
      console.warn('Could not establish WebSocket connection', err);
    }
  }

  public disconnect() {
    this.sessionId = null;
    clearTimeout(this.reconnectTimer);
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {}
      this.socket = null;
    }
  }

  public send(payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  public subscribe(handler: WSEventHandler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  // Convenience methods
  public sendChat(text: string) {
    this.send({
      type: 'CHAT_MESSAGE',
      text,
      senderName: this.userName
    });
  }

  public sendEmote(emote: string) {
    this.send({
      type: 'SEND_EMOTE',
      emote,
      senderName: this.userName
    });
  }

  public sendPosition(x: number, y: number, room: string, facing: string) {
    this.send({
      type: 'FINDER_MOVE',
      x,
      y,
      room,
      facing
    });
  }

  public sendTypingProgress(currentQuestionIndex: number) {
    this.send({
      type: 'ANSWERER_TYPING',
      currentQuestionIndex
    });
  }
}

export const wsService = new WebSocketService();
