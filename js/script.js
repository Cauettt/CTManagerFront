document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURAÇÕES ---
    const API_URL = "http://localhost:8080";
    const colorThief = new ColorThief();
    
    // --- ESTADO GLOBAL ---
    let currentUser = JSON.parse(localStorage.getItem('ctmanager_user'));
    let selectedFile = null;
    let currentPalette = [];

    // --- ELEMENTOS ---
    const ui = {
        loginModal: document.getElementById('login-modal'),
        btnCloseModal: document.getElementById('btn-close-modal'),
        loginForm: document.getElementById('login-form'),
        navBtnLogin: document.getElementById('nav-btn-login'),
        loggedArea: document.getElementById('logged-area'),
        userDisplay: document.getElementById('user-display'),
        loginError: document.getElementById('login-error'),
        fileInput: document.getElementById('file-input'),
        preview: document.getElementById('image-preview'),
        placeholder: document.getElementById('upload-placeholder'),
        actionContainer: document.getElementById('action-container'),
        btnProcess: document.getElementById('btn-process'),
        resultsSection: document.getElementById('results-section'),
        paletteGrid: document.getElementById('palette-grid'),
        btnSave: document.getElementById('btn-save-backend'),
        btnLogout: document.getElementById('btn-logout')
    };

    // --- 1. GERENCIAMENTO DE UI E LOGIN ---
    
    function updateAuthUI() {
        if (currentUser) {
            ui.navBtnLogin.classList.add('hidden');
            ui.loggedArea.classList.remove('hidden');
            // DTO só retorna email, então usamos o email ou parte dele como nome
            const nomeExibicao = currentUser.nome || currentUser.email.split('@')[0];
            ui.userDisplay.innerText = `Olá, ${nomeExibicao}`;
        } else {
            ui.navBtnLogin.classList.remove('hidden');
            ui.loggedArea.classList.add('hidden');
        }
    }

    function showLoginModal() { ui.loginModal.classList.remove('hidden'); }
    function hideLoginModal() { ui.loginModal.classList.add('hidden'); ui.loginError.classList.add('hidden'); }

    ui.navBtnLogin.addEventListener('click', showLoginModal);
    ui.btnCloseModal.addEventListener('click', hideLoginModal);

    ui.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const senha = document.getElementById('password').value;
        const btnLogin = document.getElementById('btn-submit-login');

        try {
            btnLogin.innerText = "Entrando...";
            btnLogin.disabled = true;

            // Envia 'senha' pois sua entidade Usuario usa 'senha'
            const response = await fetch(`${API_URL}/usuario/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, senha: senha }) 
            });

            if (response.ok) {
                const user = await response.json();
                localStorage.setItem('ctmanager_user', JSON.stringify(user));
                currentUser = user;
                
                updateAuthUI();
                hideLoginModal();
                alert(`Login realizado com sucesso!`);
            } else {
                ui.loginError.classList.remove('hidden');
            }
        } catch (error) {
            console.error(error);
            ui.loginError.innerText = "Erro ao conectar com o servidor.";
            ui.loginError.classList.remove('hidden');
        } finally {
            btnLogin.innerText = "Entrar";
            btnLogin.disabled = false;
        }
    });

    ui.btnLogout.addEventListener('click', () => {
        localStorage.removeItem('ctmanager_user');
        currentUser = null;
        updateAuthUI();
        window.location.reload();
    });

    // --- 2. LÓGICA DE IMAGEM ---
    ui.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = (event) => {
                ui.preview.src = event.target.result;
                ui.preview.classList.remove('hidden');
                ui.placeholder.classList.add('hidden');
                ui.actionContainer.classList.remove('hidden');
                ui.resultsSection.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }
    });

    ui.btnProcess.addEventListener('click', () => {
        if (!ui.preview.complete) return;
        
        try {
            const rgbColors = colorThief.getPalette(ui.preview, 5);
            currentPalette = rgbColors.map(rgb => 
                "#" + rgb.map(x => x.toString(16).padStart(2, '0')).join('')
            );
            
            ui.paletteGrid.innerHTML = '';
            currentPalette.forEach(hex => {
                const div = document.createElement('div');
                div.className = "h-24 rounded-lg shadow-md cursor-pointer hover:scale-105 transition transform";
                div.style.backgroundColor = hex;
                div.title = hex;
                div.onclick = () => { navigator.clipboard.writeText(hex); alert('Copiado: ' + hex); };
                ui.paletteGrid.appendChild(div);
            });
            ui.resultsSection.classList.remove('hidden');
            ui.resultsSection.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            alert('Erro ao processar imagem.');
        }
    });

    // --- 3. LÓGICA DE SALVAR (ATUALIZADA PARA SUAS DTOs) ---
    ui.btnSave.addEventListener('click', async () => {
        
        if (!currentUser || !currentUser.id) {
            showLoginModal();
            return; 
        }

        ui.btnSave.innerText = "Salvando...";
        ui.btnSave.disabled = true;

        try {
            // A. Cria CHAT
            // DTO espera: { usuario_id: Long }
            console.log("Criando Chat...");
            const chatRes = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    usuario_id: currentUser.id 
                })
            });
            
            if (!chatRes.ok) throw new Error("Falha ao criar Chat");
            const chat = await chatRes.json();
            const chatIdGerado = chat.id;

            // B. Cria IMAGEM
            // DTO espera: { chatId: Long, path: String }
            console.log("Criando Imagem vinculada ao Chat ID:", chatIdGerado);
            const imgRes = await fetch(`${API_URL}/imagem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    path: selectedFile.name, // Usando 'path' conforme DTO
                    chatId: chatIdGerado     // Usando 'chatId' camelCase conforme DTO
                })
            });

            if (!imgRes.ok) throw new Error("Falha ao salvar Imagem");
            const imagem = await imgRes.json();
            const imagemIdGerado = imagem.id;

            // C. Salva CORES
            // DTO espera: { imagem_id: Long, hexcode: String }
            // IMPORTANTE: Agora vinculamos a cor à IMAGEM, e não ao Chat
            console.log("Salvando cores vinculadas à Imagem ID:", imagemIdGerado);
            
            const promises = currentPalette.map(hex => 
                fetch(`${API_URL}/cor`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        hexcode: hex,          // Conforme DTO
                        imagem_id: imagemIdGerado // Conforme DTO (snake_case)
                    })
                })
            );
            await Promise.all(promises);

            alert("✅ Projeto salvo com sucesso!");

        } catch (error) {
            console.error(error);
            alert("❌ Erro ao salvar. Verifique o console (F12).");
        } finally {
            ui.btnSave.innerText = "Salvar no Banco";
            ui.btnSave.disabled = false;
        }
    });

    updateAuthUI();
});