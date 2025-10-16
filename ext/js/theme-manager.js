// Менеджер темы оформления
const ThemeManager = {
    // Функция переключения темы
    toggleTheme() {
        const html = document.documentElement;
        const themeToggle = document.getElementById('theme-toggle');
        const themeStatus = document.getElementById('theme-status');

        if (html.classList.contains('dark')) {
            html.classList.remove('dark');
            html.classList.add('light');
            if (themeToggle) themeToggle.classList.remove('active');
            if (themeStatus) themeStatus.textContent = 'Светлая';
            localStorage.setItem('theme', 'light');
        } else {
            html.classList.remove('light');
            html.classList.add('dark');
            if (themeToggle) themeToggle.classList.add('active');
            if (themeStatus) themeStatus.textContent = 'Космос';
            localStorage.setItem('theme', 'dark');
        }
    },

    // Инициализация темы из localStorage
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        const themeToggle = document.getElementById('theme-toggle');
        const themeStatus = document.getElementById('theme-status');
        const html = document.documentElement;

        if (savedTheme === 'light') {
            html.classList.remove('dark');
            html.classList.add('light');
            if (themeToggle) themeToggle.classList.remove('active');
            if (themeStatus) themeStatus.textContent = 'Светлая';
        } else {
            html.classList.remove('light');
            html.classList.add('dark');
            if (themeToggle) themeToggle.classList.add('active');
            if (themeStatus) themeStatus.textContent = 'Космос';
        }
    },

    // Обновление времени и даты
    updateDateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString('ru-RU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });

        document.getElementById('current-time').textContent = timeString;
        document.getElementById('current-date').textContent = dateString.charAt(0).toUpperCase() + dateString.slice(1);
    },

    // Инициализация времени
    initDateTime() {
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 60000);
    }
};