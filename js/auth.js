// js/auth.js
export const auth = {
    // Salva usuário no LocalStorage
    login: (user) => {
        localStorage.setItem('ctmanager_user', JSON.stringify(user));
    },

    // Remove usuário
    logout: () => {
        localStorage.removeItem('ctmanager_user');
        window.location.href = 'index.html'; // Redireciona para home
    },

    // Pega usuário atual
    getUser: () => {
        const user = localStorage.getItem('ctmanager_user');
        return user ? JSON.parse(user) : null;
    },

    // Verifica se está logado, se não, redireciona ou avisa
    requireLogin: () => {
        const user = auth.getUser();
        if (!user || !user.id) return false;
        return true;
    }
};