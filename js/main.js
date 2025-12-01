import { api } from './api.js';
import { auth } from './auth.js';
import { UI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    let selectedFile = null;
    let currentPalette = [];
    const colorThief = new ColorThief();

    const ui = {
        loginModal: document.getElementById('login-modal'),
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        modalTitle: document.getElementById('modal-title'),
        linkToRegister: document.getElementById('link-to-register'),
        linkToLogin: document.getElementById('link-to-login'),
        authError: document.getElementById('auth-error'),
        navBtnLogin: document.getElementById('nav-btn-login'),
        loggedArea: document.getElementById('logged-area'),
        userDisplay: document.getElementById('user-display'),
        fileInput: document.getElementById('file-input'),
        previewContainer: document.getElementById('preview-container'),
        imagePreview: document.getElementById('image-preview'),
        placeholder: document.getElementById('upload-placeholder'),
        actionContainer: document.getElementById('action-container'),
        btnProcess: document.getElementById('btn-process'),
        resultsSection: document.getElementById('results-section'),
        paletteGrid: document.getElementById('palette-grid'),
        btnSave: document.getElementById('btn-save-backend'),
        btnLogout: document.getElementById('btn-logout')
    };

    UI.modal.init();
    UI.toast.init();

    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    ui.fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = (ev) => {
                ui.imagePreview.src = ev.target.result;
                ui.placeholder.classList.add('hidden');
                ui.previewContainer.classList.remove('hidden');
                ui.actionContainer.classList.remove('hidden');
                ui.resultsSection.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }
    };

    ui.btnProcess.onclick = () => {
        if (!ui.imagePreview.complete || ui.imagePreview.naturalWidth === 0) return;
        try {
            const rgbColors = colorThief.getPalette(ui.imagePreview, 5);
            currentPalette = rgbColors.map(rgb => "#" + rgb.map(x => x.toString(16).padStart(2, '0')).join(''));
            ui.paletteGrid.innerHTML = '';
            currentPalette.forEach(hex => {
                const div = document.createElement('div');
                // Atualizado para dark mode border
                div.className = "h-24 rounded-lg shadow-md cursor-pointer hover:scale-105 transition transform border border-slate-100 dark:border-slate-700 relative group";
                div.style.backgroundColor = hex;
                div.innerHTML = `<div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 text-white font-bold text-xs">COPIAR</div>`;
                div.onclick = () => { 
                    navigator.clipboard.writeText(hex); 
                    UI.toast.show(`Cor ${hex} copiada!`);
                };
                ui.paletteGrid.appendChild(div);
            });
            ui.resultsSection.classList.remove('hidden');
            ui.resultsSection.scrollIntoView({ behavior: 'smooth' });
        } catch(e) { UI.modal.alert("Erro", "Erro ao processar imagem.", "error"); }
    };

    ui.btnSave.onclick = async () => {
        const user = auth.getUser();
        if (!user) { ui.loginModal.classList.remove('hidden'); return; }
        const inputNome = document.getElementById('project-name-input').value;
        const tituloProjeto = inputNome.trim() || (selectedFile ? selectedFile.name : "Novo Projeto");
        ui.btnSave.innerText = "Salvando...";
        ui.btnSave.disabled = true;
        try {
            const chat = await api.criarChat(user.id, tituloProjeto);
            const base64 = await toBase64(selectedFile);
            const imagem = await api.salvarImagem(chat.id, base64);
            const promises = currentPalette.map(hex => api.salvarCor(imagem.id, hex));
            await Promise.all(promises);
            UI.modal.alert("Sucesso", "Projeto salvo!", "success", () => { window.location.href = "chats.html"; });
        } catch (error) { UI.modal.alert("Erro", "Erro ao salvar.", "error"); }
        finally { ui.btnSave.innerText = "Salvar"; ui.btnSave.disabled = false; }
    };

    function updateAuthUI() {
        const user = auth.getUser();
        if (user) {
            ui.navBtnLogin.classList.add('hidden');
            ui.loggedArea.classList.remove('hidden');
            ui.userDisplay.innerText = `Olá, ${user.nome || user.email.split('@')[0]}`;
            if(!document.getElementById('link-chats')) {
                const link = document.createElement('a');
                link.id = 'link-chats';
                link.href = 'chats.html';
                // Link dark mode
                link.className = 'text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 mr-4';
                link.innerText = 'Meus Projetos';
                ui.loggedArea.prepend(link);
            }
        } else {
            ui.navBtnLogin.classList.remove('hidden');
            ui.loggedArea.classList.add('hidden');
            const link = document.getElementById('link-chats');
            if(link) link.remove();
        }
    }

    ui.navBtnLogin.onclick = () => ui.loginModal.classList.remove('hidden');
    document.getElementById('btn-close-modal').onclick = () => { ui.loginModal.classList.add('hidden'); ui.authError.classList.add('hidden'); };
    ui.linkToRegister.onclick = (e) => { e.preventDefault(); ui.loginForm.classList.add('hidden'); ui.registerForm.classList.remove('hidden'); ui.modalTitle.innerText = "Criar Conta"; ui.authError.classList.add('hidden'); };
    ui.linkToLogin.onclick = (e) => { e.preventDefault(); ui.registerForm.classList.add('hidden'); ui.loginForm.classList.remove('hidden'); ui.modalTitle.innerText = "Bem-vindo"; ui.authError.classList.add('hidden'); };

    ui.loginForm.onsubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await api.login(document.getElementById('email').value, document.getElementById('password').value);
            auth.login(user);
            updateAuthUI();
            ui.loginModal.classList.add('hidden');
            UI.toast.show(`Bem-vindo, ${user.nome || 'Usuário'}!`);
        } catch (e) { ui.authError.innerText = "Credenciais inválidas."; ui.authError.classList.remove('hidden'); }
    };

    ui.registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('reg-email').value;
        const senha = document.getElementById('reg-password').value;
        const confirmacao = document.getElementById('reg-confirm-password').value;
        if (senha !== confirmacao) { ui.authError.innerText = "As senhas não coincidem."; ui.authError.classList.remove('hidden'); return; }
        const nomeAutomatico = email.split('@')[0];
        const nomeFormatado = nomeAutomatico.charAt(0).toUpperCase() + nomeAutomatico.slice(1);
        try {
            await api.register({ nome: nomeFormatado, email: email, senha: senha });
            const user = await api.login(email, senha);
            auth.login(user);
            updateAuthUI();
            ui.loginModal.classList.add('hidden');
            UI.modal.alert("Bem-vindo", "Conta criada com sucesso!", "success");
        } catch (e) { ui.authError.innerText = "Erro ao criar conta."; ui.authError.classList.remove('hidden'); }
    };

    if(ui.btnLogout) ui.btnLogout.onclick = auth.logout;
    updateAuthUI();
});