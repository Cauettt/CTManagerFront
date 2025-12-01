const API_URL = "http://localhost:8080";

async function request(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    if (!response.ok) {
        // Tenta ler o erro, mas se falhar, retorna status genérico
        const text = await response.text().catch(() => "Erro desconhecido");
        throw new Error(`Erro API (${response.status}): ${text}`);
    }

    // --- CORREÇÃO AQUI ---
    // Se o status for 204 (No Content) ou o corpo for vazio, retorna null
    // Isso evita o erro ao deletar (que retorna void no Java)
    const text = await response.text();
    return text ? JSON.parse(text) : {}; 
}

export const api = {
    // Auth
    login: (email, senha) => request('/usuario/login', 'POST', { email, senha }),
    register: (usuario) => request('/usuario', 'POST', usuario),
    
    // Chat (Agora suporta criar com título, atualizar e deletar)
    criarChat: (usuario_id, titulo) => request('/chat', 'POST', { usuario_id, titulo }),
    listarChatsUsuario: (userId) => request(`/chat/usuario/${userId}`),
    
    atualizarChat: (id, titulo) => request(`/chat/${id}`, 'PUT', { titulo }), // Renomear
    deletarChat: (id) => request(`/chat/${id}`, 'DELETE'),                    // Deletar
    
    // Imagem
    salvarImagem: (chatId, path) => request('/imagem', 'POST', { chatId, path }),
    listarTodasImagens: () => request('/imagem', 'GET'),
    
    // Cor
    salvarCor: (imagem_id, hexcode) => request('/cor', 'POST', { imagem_id, hexcode }),
    buscarCoresDoChat: (chatId) => request(`/cor/chat/${chatId}`)
};