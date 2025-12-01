import { api } from './api.js';
import { auth } from './auth.js';
import { UI } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getUser();
    if (!user) { window.location.href = 'index.html'; return; }

    document.getElementById('user-display').innerText = user.nome || user.email.split('@')[0];
    document.getElementById('btn-logout').onclick = auth.logout;
    lucide.createIcons();
    UI.modal.init();
    UI.toast.init();

    const el = {
        list: document.getElementById('chats-list'),
        placeholder: document.getElementById('chat-placeholder'),
        content: document.getElementById('chat-content'),
        titleInput: document.getElementById('chat-title-input'),
        idDisplay: document.getElementById('chat-id-display'),
        btnEdit: document.getElementById('btn-edit-title'),
        btnDelete: document.getElementById('btn-delete-chat'),
        messages: document.getElementById('messages-area')
    };

    let currentChatId = null; 

    async function refreshList() {
        try {
            const chats = await api.listarChatsUsuario(user.id);
            el.list.innerHTML = '';
            if (chats.length === 0) { el.list.innerHTML = '<p class="text-center text-sm text-slate-400 dark:text-slate-500 mt-4">Nenhum projeto.</p>'; return; }
            chats.reverse().forEach(chat => {
                const item = document.createElement('div');
                const isActive = chat.id === currentChatId;
                // Classes Dark Mode para item ativo/inativo da lista
                const activeClasses = isActive ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent";
                item.className = `flex items-center gap-3 p-3 rounded-lg cursor-pointer transition border-b ${activeClasses} group`;
                item.onclick = () => loadChatDetails(chat);
                const tituloExibicao = chat.titulo || `Projeto ${chat.id}`;
                item.innerHTML = `
                    <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">#${chat.id}</div>
                    <div class="overflow-hidden">
                        <h4 class="font-bold text-slate-700 dark:text-slate-200 text-sm truncate">${tituloExibicao}</h4>
                        <p class="text-xs text-slate-400 dark:text-slate-500 truncate">Clique para abrir</p>
                    </div>`;
                el.list.appendChild(item);
            });
        } catch (e) { console.error(e); }
    }

    async function loadChatDetails(chat) {
        currentChatId = chat.id;
        refreshList();
        el.placeholder.classList.add('hidden');
        el.content.classList.remove('hidden');
        el.titleInput.value = chat.titulo || `Projeto ${chat.id}`;
        el.titleInput.disabled = false;
        el.idDisplay.innerText = `ID: ${chat.id}`;
        el.btnEdit.classList.remove('hidden');
        el.btnDelete.classList.remove('hidden');
        el.messages.innerHTML = '<div class="flex justify-center mt-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>';
        try {
            const cores = await api.buscarCoresDoChat(chat.id);
            let imagemSrc = null;
            try {
                const todasImagens = await api.listarTodasImagens();
                const img = todasImagens.find(i => (i.chatId == chat.id) || (i.chat && i.chat.id == chat.id));
                if (img) imagemSrc = img.path;
            } catch (err) {}
            renderConversation(imagemSrc, cores);
        } catch (error) { el.messages.innerHTML = '<p class="text-center text-red-500">Erro ao carregar.</p>'; }
    }

    async function saveTitle() {
        if (!currentChatId) return;
        const novoTitulo = el.titleInput.value.trim();
        if (!novoTitulo) return;
        try {
            await api.atualizarChat(currentChatId, novoTitulo);
            el.titleInput.classList.add('text-green-600', 'dark:text-green-400');
            setTimeout(() => el.titleInput.classList.remove('text-green-600', 'dark:text-green-400'), 1000);
            refreshList();
        } catch (error) { UI.modal.alert("Erro", "Não foi possível renomear.", "error"); }
    }

    el.titleInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') el.titleInput.blur(); });
    el.titleInput.addEventListener('blur', saveTitle);
    el.btnEdit.onclick = () => el.titleInput.focus();
    el.btnDelete.onclick = async () => {
        if (!currentChatId) return;
        UI.modal.confirm("Excluir Projeto", "Tem certeza? Essa ação não pode ser desfeita.", async () => {
            try {
                await api.deletarChat(currentChatId);
                currentChatId = null;
                el.content.classList.add('hidden');
                el.placeholder.classList.remove('hidden');
                refreshList();
                UI.toast.show("Projeto excluído.");
            } catch (error) { UI.modal.alert("Erro", "Falha ao excluir.", "error"); }
        });
    };

    function renderConversation(imgSrc, cores) {
        el.messages.innerHTML = '';
        if (imgSrc) {
            const userDiv = document.createElement('div');
            userDiv.className = "flex justify-end mb-6";
            if (imgSrc.startsWith('data:image')) {
                userDiv.innerHTML = `<div class="flex flex-col items-end"><div class="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-t-md mb-0 shadow-sm w-fit">IMAGEM ORIGINAL</div><img src="${imgSrc}" class="rounded-l-xl rounded-br-xl shadow-lg border-4 border-blue-600 max-w-[200px] md:max-w-md bg-white dark:bg-slate-800"></div>`;
            } else {
                // Card de arquivo dark mode
                userDiv.innerHTML = `<div class="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 rounded-2xl p-3 shadow-sm max-w-xs flex items-center gap-3"><i data-lucide="file-image"></i><span class="truncate">${imgSrc}</span></div>`;
            }
            el.messages.appendChild(userDiv);
        }
        if (cores && cores.length > 0) {
            const botDiv = document.createElement('div');
            botDiv.className = "flex justify-start w-full";
            botDiv.innerHTML = `
                <div class="flex flex-col items-start w-full max-w-3xl">
                    <span class="text-sm font-bold text-slate-600 dark:text-slate-300 ml-1 mb-2">Paleta Gerada</span>
                    <div class="flex w-full h-24 sm:h-32 rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700">
                        ${cores.map(c => `
                            <div onclick="navigator.clipboard.writeText('${c.hexcode}'); UI.toast.show('Copiado: ${c.hexcode}')" 
                                class="flex-1 h-full cursor-pointer hover:flex-[1.5] transition-all flex items-end justify-center pb-2 group"
                                style="background-color: ${c.hexcode}">
                                <span class="bg-black/50 text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100">${c.hexcode}</span>
                            </div>`).join('')}
                    </div>
                </div>`;
            el.messages.appendChild(botDiv);
        }
        lucide.createIcons();
    }
    refreshList();
});