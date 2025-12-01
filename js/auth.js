// js/auth.js
export const auth = {
    login: (user) => {
        localStorage.setItem('ctmanager_user', JSON.stringify(user));
    },

    logout: () => {
        localStorage.removeItem('ctmanager_user');
        window.location.href = 'index.html';
    },

 
    getUser: () => {
        const user = localStorage.getItem('ctmanager_user');
        return user ? JSON.parse(user) : null;
    },

    requireLogin: () => {
        const user = auth.getUser();
        if (!user || !user.id) return false;
        return true;
    }
};
