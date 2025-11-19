import * as vscode from 'vscode';

let intervalHandle: NodeJS.Timeout | undefined;
let isRunning = false;

interface MotivationConfig {
    intervalMinutes: number;
    phrases: string[];
}

function getConfig(): MotivationConfig {
    const config = vscode.workspace.getConfiguration('motivationNotifier');
    const intervalMinutes = config.get<number>('intervalMinutes', 30);
    const phrases = config.get<string[]>('phrases', [
        'Сделай маленький шаг',
        'Сохрани файл — сэкономишь нервную клетку',
        'Не забудь пить воду'
    ]);
    return {
        intervalMinutes: Math.max(1, intervalMinutes),
        phrases: phrases.filter(p => p.trim().length > 0)
    };
}

function showRandomPhrase() {
    const cfg = getConfig();
    if (cfg.phrases.length === 0) {
        return;
    }
    const phrase = cfg.phrases[Math.floor(Math.random() * cfg.phrases.length)];
    vscode.window.showInformationMessage(phrase);
}

function startTimer() {
    if (isRunning) {
        return;
    }
    const cfg = getConfig();
    const delayMs = cfg.intervalMinutes * 60_000;

    isRunning = true;
    intervalHandle = setInterval(() => {
        showRandomPhrase();
    }, delayMs);

    vscode.window.showInformationMessage(
        `Motivation Notifier запущен (каждые ${cfg.intervalMinutes} минут).`
    );
}

function stopTimer() {
    if (!isRunning) {
        return;
    }
    if (intervalHandle) {
        clearInterval(intervalHandle);
        intervalHandle = undefined;
    }
    isRunning = false;
    vscode.window.showInformationMessage('Motivation Notifier остановлен.');
}

export function activate(context: vscode.ExtensionContext) {
    const toggleCommand = vscode.commands.registerCommand(
        'motivationNotifier.toggle',
        () => {
            if (isRunning) {
                stopTimer();
            } else {
                startTimer();
            }
        }
    );

    // Если пользователь меняет настройки во время работы — перезапускаем таймер
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('motivationNotifier') && isRunning) {
            stopTimer();
            startTimer();
        }
    });

    context.subscriptions.push(toggleCommand, configChangeListener);
}

export function deactivate() {
    stopTimer();
}
