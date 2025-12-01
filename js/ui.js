export const UI = {
    modal: {
        element: null,
        title: null,
        message: null,
        btnConfirm: null,
        btnCancel: null,
        icon: null,
        init() {
            this.element = document.getElementById('app-modal');
            this.title = document.getElementById('app-modal-title');
            this.message = document.getElementById('app-modal-message');
            this.btnConfirm = document.getElementById('app-modal-confirm');
            this.btnCancel = document.getElementById('app-modal-cancel');
            this.icon = document.getElementById('app-modal-icon');
        },
        close() { if (this.element) this.element.classList.add('hidden'); },
        alert(title, message, type = 'info', onOk = null) {
            this._setup(title, message, type);
            this.btnCancel.classList.add('hidden');
            this.btnConfirm.innerText = "OK";
            this.btnConfirm.onclick = () => { this.close(); if (onOk) onOk(); };
            this.element.classList.remove('hidden');
        },
        confirm(title, message, onConfirm) {
            this._setup(title, message, 'warning');
            this.btnCancel.classList.remove('hidden');
            this.btnConfirm.innerText = "Confirmar";
            this.btnCancel.onclick = () => this.close();
            this.btnConfirm.onclick = () => { this.close(); if (onConfirm) onConfirm(); };
            this.element.classList.remove('hidden');
        },
        _setup(title, message, type) {
            if (!this.element) this.init();
            this.title.innerText = title;
            this.message.innerText = message;
            const svg = this.icon.querySelector('svg');
            const path = this.icon.querySelector('path');
            this.btnConfirm.className = "w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none sm:ml-3 sm:w-auto sm:text-sm";
            
            if (type === 'error') {
                this.btnConfirm.classList.add('bg-red-600', 'hover:bg-red-700');
                svg.classList.value = "h-6 w-6 text-red-600";
                path.setAttribute('d', 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z');
            } else if (type === 'success') {
                this.btnConfirm.classList.add('bg-green-600', 'hover:bg-green-700');
                svg.classList.value = "h-6 w-6 text-green-600";
                path.setAttribute('d', 'M5 13l4 4L19 7');
            } else {
                this.btnConfirm.classList.add('bg-blue-600', 'hover:bg-blue-700');
                svg.classList.value = "h-6 w-6 text-blue-600";
                path.setAttribute('d', 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z');
            }
        }
    },
    toast: {
        element: null,
        init() { this.element = document.getElementById('app-toast'); },
        show(message, type = 'success') {
            if (!this.element) this.init();
            const text = this.element.querySelector('p');
            text.innerText = message;
            const content = this.element.querySelector('div');
            // Cores do Toast para Dark Mode
            content.className = `rounded-lg shadow-lg p-4 flex items-center gap-3 text-white transition transform duration-300 border dark:border-slate-600 ${type === 'error' ? 'bg-red-600 dark:bg-red-700' : 'bg-slate-800 dark:bg-slate-700'}`;
            this.element.classList.remove('hidden', 'translate-y-10', 'opacity-0');
            setTimeout(() => {
                this.element.classList.add('translate-y-10', 'opacity-0');
                setTimeout(() => this.element.classList.add('hidden'), 300);
            }, 2000);
        }
    }
};