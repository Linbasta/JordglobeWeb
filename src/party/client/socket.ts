/**
 * WebSocket client for JordGlobe Party
 *
 * Handles communication with the game server.
 */

import { Player } from './waiting-screen';
import { config } from '../../config';

// Question types - matches server format
type Question = {
    present: 'text' | 'video';
    answer: 'city' | 'country';
    lat: number;
    lng: number;
    // For text questions
    prompt?: string;
    locationName?: string;
    // For video questions
    youtubeId?: string;
    startTime?: number;
    endTime?: number;
};

type MessageHandler = {
    'joined': (data: { name: string; isFirst: boolean; players: Player[] }) => void;
    'player-list': (data: { players: Player[] }) => void;
    'game-start': () => void;
    'question': (data: { question: Question; showPresentationOnClient: boolean; round: number; maxRounds: number }) => void;
    'reveal': (data: { question: Question; correct: { lat: number; lng: number; locationName: string }; results: { name: string; distance: number; points: number; lat: number; lng: number; positions: any[] }[] }) => void;
    'final-results': (data: { players: Player[] }) => void;
    'error': (data: { message: string }) => void;
    'player-answered': (data: { playerName: string }) => void;
};

export class GameSocket {
    private ws: WebSocket | null = null;
    private handlers: Partial<MessageHandler> = {};
    private serverUrl: string;

    constructor(serverUrl?: string) {
        // Use config for environment-aware WebSocket URL
        // In dev: ws://localhost:3003
        // In prod: wss://your-app.run.app
        this.serverUrl = serverUrl || config.websocketUrl;
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.serverUrl);

            this.ws.onopen = () => {
                console.log('Connected to server');
                resolve();
            };

            this.ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                reject(err);
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('Received:', message);

                    const handler = this.handlers[message.type as keyof MessageHandler];
                    if (handler) {
                        (handler as Function)(message);
                    }
                } catch (err) {
                    console.error('Error parsing message:', err);
                }
            };

            this.ws.onclose = () => {
                console.log('Disconnected from server');
            };
        });
    }

    join(name: string): void {
        this.send({ type: 'join', name });
    }

    startGame(maxRounds?: number): void {
        this.send({ type: 'start-game', maxRounds });
    }

    submitAnswer(lat: number, lng: number, positions?: { lat: number; lng: number; timestamp: number }[]): void {
        this.send({ type: 'submit-answer', lat, lng, positions });
    }

    nextRound(): void {
        this.send({ type: 'next-round' });
    }

    on<K extends keyof MessageHandler>(event: K, handler: MessageHandler[K]): void {
        this.handlers[event] = handler;
    }

    private send(message: object): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
}
