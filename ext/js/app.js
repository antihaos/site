// Главный файл приложения
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация темы
    ThemeManager.initTheme();
    ThemeManager.initDateTime();

    // Инициализация данных
    DataManager.initAllData();

    // Инициализация навигации
    NavigationManager.initNavigation();
    NavigationManager.initQuickAccess();

    // Инициализация модальных окон
    ModalManager.initAccessCodes();

    // Обработчик для переключателя темы
    document.addEventListener('click', function(e) {
        if (e.target.closest('#theme-toggle')) {
            ThemeManager.toggleTheme();
        }
    });

    // Эффект нажатия для всех элементов с классом ios-press
    const pressElements = document.querySelectorAll('.ios-press');

    pressElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.classList.add('opacity-80', 'scale-95');
        });

        element.addEventListener('touchend', function() {
            this.classList.remove('opacity-80', 'scale-95');
        });

        element.addEventListener('mousedown', function() {
            this.classList.add('opacity-80', 'scale-95');
        });

        element.addEventListener('mouseup', function() {
            this.classList.remove('opacity-80', 'scale-95');
        });

        element.addEventListener('mouseleave', function() {
            this.classList.remove('opacity-80', 'scale-95');
        });
    });

    // Функциональность кнопки воспроизведения музыки
    const playButton = document.getElementById('play-button');
    let isPlaying = false;
    let musicProgress = 0;
    let musicInterval;

    if (playButton) {
        playButton.addEventListener('click', function() {
            const icon = document.getElementById('play-icon');
            if (isPlaying) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
                clearInterval(musicInterval);
                appData.music.isPlaying = false;
            } else {
                icon.classList.remove('fa-play');
                icon.classList.add('fa-pause');
                appData.music.isPlaying = true;
                // Запуск прогресса музыки
                musicInterval = setInterval(() => {
                    musicProgress += 0.5;
                    if (musicProgress > 100) musicProgress = 0;
                    document.getElementById('music-progress').style.width = musicProgress + '%';
                    appData.music.progress = musicProgress;

                    // Обновление времени
                    const currentTime = Math.floor(musicProgress * 2.25 / 100);
                    document.getElementById('music-time').textContent = '0:' + (currentTime < 10 ? '0' + currentTime : currentTime);
                }, 1000);
            }
            isPlaying = !isPlaying;
        });
    }

    // Добавление новых напоминаний
    const addReminderBtn = document.getElementById('add-reminder');
    const newReminderInput = document.getElementById('new-reminder');

    if (addReminderBtn && newReminderInput) {
        addReminderBtn.addEventListener('click', function() {
            const text = newReminderInput.value.trim();
            if (text) {
                const newReminder = {
                    id: Date.now(),
                    text: text,
                    completed: false
                };
                appData.reminders.tasks.push(newReminder);
                DataManager.loadRemindersData();
                newReminderInput.value = '';
            }
        });

        newReminderInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addReminderBtn.click();
            }
        });
    }

    // Фильтрация уведомлений
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');

            // Обновляем активную кнопку
            filterButtons.forEach(btn => btn.classList.remove('active-filter', 'bg-ios-blue', 'bg-opacity-80'));
            this.classList.add('active-filter', 'bg-ios-blue', 'bg-opacity-80');

            // Фильтруем уведомления
            const notifications = document.querySelectorAll('.notification-item');
            notifications.forEach(notification => {
                if (filter === 'all') {
                    notification.style.display = 'block';
                } else if (filter === 'unread') {
                    notification.style.display = notification.querySelector('.pulse-notification') ? 'block' : 'none';
                } else {
                    notification.style.display = notification.getAttribute('data-type') === filter ? 'block' : 'none';
                }
            });
        });
    });

    // Кнопка аварии
    document.addEventListener('click', function(e) {
        if (e.target.closest('#emergency-btn')) {
            alert('АВАРИЙНЫЙ РЕЖИМ АКТИВИРОВАН!\n\nВсе системы переведены в режим повышенной готовности. Связь с ЦУП установлена.');

            // Добавляем аварийное уведомление
            const emergencyNotification = {
                id: Date.now(),
                type: "alert",
                title: "АВАРИЙНЫЙ РЕЖИМ",
                message: "Активирован аварийный протокол",
                time: "Только что",
                icon: "icon-gradient-6",
                unread: true
            };

            appData.notifications.items.unshift(emergencyNotification);
            DataManager.loadNotificationsData();

            NavigationManager.switchSection('notifications-section');
        }
    });

    // Поиск
    const searchInput = document.getElementById('search-input');
    const searchItems = document.querySelectorAll('[data-search]');

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchText = this.value.toLowerCase();

            searchItems.forEach(item => {
                const searchData = item.getAttribute('data-search').toLowerCase();
                if (searchData.includes(searchText)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Переключение настроек
    document.addEventListener('click', function(e) {
        if (e.target.closest('.toggle-setting')) {
            const element = e.target.closest('.toggle-setting');
            const settingId = element.getAttribute('data-id');
            const statusElement = document.getElementById(`setting-${settingId}`);

            if (statusElement) {
                if (statusElement.textContent === 'Активна' || statusElement.textContent === 'Вкл.') {
                    statusElement.textContent = statusElement.textContent === 'Активна' ? 'Отключена' : 'Выкл.';
                } else {
                    statusElement.textContent = statusElement.textContent === 'Отключена' ? 'Активна' : 'Вкл.';
                }
            }
        }
    });

    // Имитация загрузки контента
    setTimeout(() => {
        const fadeElements = document.querySelectorAll('.fade-in');
        fadeElements.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }, 100);
});