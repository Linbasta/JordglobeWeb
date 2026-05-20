let containerEl: HTMLDivElement | null = null;
let inputEl: HTMLInputElement | null = null;

export function createInput(onGuess: (text: string) => void): void {
    disposeInput();

    containerEl = document.createElement('div');
    containerEl.style.cssText =
        'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
        'z-index:50;display:flex;flex-direction:column;align-items:center;gap:6px;';

    const label = document.createElement('div');
    label.style.cssText = 'color:rgba(255,255,255,0.5);font-size:12px;font-family:system-ui,sans-serif;';
    label.textContent = 'Type your guess...';
    containerEl.appendChild(label);

    inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.autocomplete = 'off';
    inputEl.spellcheck = false;
    inputEl.style.cssText =
        'width:360px;max-width:80vw;padding:12px 20px;' +
        'background:rgba(10,10,20,0.8);color:#fff;border:2px solid rgba(255,255,255,0.2);' +
        'border-radius:24px;font-size:16px;font-family:system-ui,sans-serif;' +
        'outline:none;text-align:center;' +
        'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);' +
        'transition:border-color 0.3s;';

    inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && inputEl!.value.trim()) {
            onGuess(inputEl!.value);
            inputEl!.value = '';
        }
    });

    containerEl.appendChild(inputEl);
    document.body.appendChild(containerEl);

    inputEl.focus();
}

export function flashCorrect(): void {
    if (!inputEl) return;
    inputEl.style.borderColor = '#4CAF50';
    setTimeout(() => {
        if (inputEl) inputEl.style.borderColor = 'rgba(255,255,255,0.2)';
    }, 400);
}

export function flashWrong(): void {
    if (!inputEl) return;
    inputEl.style.borderColor = '#f44336';
    setTimeout(() => {
        if (inputEl) inputEl.style.borderColor = 'rgba(255,255,255,0.2)';
    }, 400);
}

export function disableInput(): void {
    if (inputEl) {
        inputEl.disabled = true;
        inputEl.style.opacity = '0.4';
    }
}

export function disposeInput(): void {
    if (containerEl) {
        containerEl.remove();
        containerEl = null;
        inputEl = null;
    }
}
