// Функции для работы с JSON данными
const DataManager = {
    // Обновление данных виджета с анимацией
    updateWidget(widgetId, data) {
        const widget = document.getElementById(widgetId);
        if (widget) {
            widget.classList.add('data-updating');
            setTimeout(() => {
                widget.classList.remove('data-updating');
            }, 1000);
        }
        return data;
    },

    // Загрузка данных погоды
    loadWeatherData() {
        const weather = this.updateWidget('weather-widget', appData.weather);
        document.getElementById('weather-location').textContent = weather.location;
        document.getElementById('weather-temp').textContent = weather.temperature;
        document.getElementById('weather-desc').textContent = weather.description;
        document.getElementById('solar-wind').textContent = weather.solarWind;
        document.getElementById('radiation-level').textContent = weather.radiation;
    },

    // Загрузка данных календаря
    loadCalendarData() {
        const calendar = this.updateWidget('calendar-widget', appData.calendar);
        const container = document.getElementById('calendar-events');
        container.innerHTML = '';

        calendar.events.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'flex items-center space-x-3 mt-2';
            eventElement.innerHTML = `
                <div class="w-10 h-10 rounded-full flex items-center justify-center liquid-glass ${event.icon}">
                    <span class="text-xs font-medium">${event.date}</span>
                </div>
                <div>
                    <p class="font-medium">${event.title}</p>
                    <p class="text-white text-opacity-70 text-sm">${event.time}</p>
                </div>
            `;
            container.appendChild(eventElement);
        });
    },

    // Загрузка данных напоминаний
    loadRemindersData() {
        const reminders = this.updateWidget('reminders-widget', appData.reminders);
        const container = document.getElementById('reminders-list');
        container.innerHTML = '';

        reminders.tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'flex items-center space-x-3 mt-2';
            taskElement.innerHTML = `
                <div class="w-5 h-5 rounded-full border border-white border-opacity-30 flex items-center justify-center reminder-checkbox liquid-glass" data-id="${task.id}">
                    <div class="w-3 h-3 rounded-full bg-ios-blue bg-opacity-80 ${task.completed ? '' : 'hidden'}"></div>
                </div>
                <p class="${task.completed ? 'opacity-50 line-through' : ''}">${task.text}</p>
            `;
            container.appendChild(taskElement);
        });

        // Добавляем обработчики для чекбоксов
        this.initReminderCheckboxes();
    },

    // Загрузка данных систем
    loadSystemsData() {
        const systems = this.updateWidget('systems-widget', appData.systems);
        const container = document.getElementById('systems-status');
        container.innerHTML = '';

        systems.status.forEach(system => {
            const statusColor = system.status === 'normal' ? 'bg-ios-green' :
                              system.status === 'warning' ? 'bg-ios-orange' : 'bg-ios-red';

            const systemElement = document.createElement('div');
            systemElement.className = 'flex items-center space-x-2';
            systemElement.innerHTML = `
                <div class="w-3 h-3 rounded-full ${statusColor}"></div>
                <span class="text-sm">${system.name}</span>
            `;
            container.appendChild(systemElement);
        });

        document.getElementById('power-level').textContent = systems.power.level + '%';
        document.getElementById('station-power').style.width = systems.power.level + '%';
        document.getElementById('station-time').textContent = systems.power.timeToRecharge + ' до подзарядки';
    },

    // Загрузка данных музыки
    loadMusicData() {
        const music = this.updateWidget('music-widget', appData.music);
        document.getElementById('music-track').textContent = music.currentTrack;
        document.getElementById('music-progress').style.width = music.progress + '%';

        const currentTime = Math.floor(music.progress * 3.45 / 100);
        document.getElementById('music-time').textContent = '0:' + (currentTime < 10 ? '0' + currentTime : currentTime);
    },

    // Загрузка данных поиска
    loadSearchData() {
        const search = appData.search;

        // Недавние поиски
        const recentContainer = document.getElementById('recent-searches');
        recentContainer.innerHTML = '';
        search.recent.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'flex items-center space-x-3 ios-press';
            itemElement.setAttribute('data-search', item.text.toLowerCase());
            itemElement.innerHTML = `
                <div class="w-8 h-8 rounded-full flex items-center justify-center liquid-glass ${item.icon}">
                    <i class="fas fa-clock text-xs"></i>
                </div>
                <p>${item.text}</p>
            `;
            recentContainer.appendChild(itemElement);
        });

        // Быстрый доступ
        const quickAccessContainer = document.getElementById('quick-access');
        quickAccessContainer.innerHTML = '';
        search.quickAccess.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'rounded-2xl p-3 text-center ios-press liquid-glass';
            if (item.section !== 'emergency') {
                itemElement.setAttribute('data-section', item.section);
            } else {
                itemElement.id = 'emergency-btn';
            }
            itemElement.innerHTML = `
                <div class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 liquid-glass ${item.icon}">
                    <i class="fas ${item.section === 'emergency' ? 'fa-exclamation-triangle' :
                                  item.section === 'home-section' ? 'fa-home' :
                                  item.section === 'notifications-section' ? 'fa-bell' : 'fa-cog'}"></i>
                </div>
                <p class="text-xs">${item.name}</p>
            `;
            quickAccessContainer.appendChild(itemElement);
        });
    },

    // Загрузка данных уведомлений
    loadNotificationsData() {
        const notifications = this.updateWidget('notifications-container', appData.notifications);
        const container = document.getElementById('notifications-container');
        container.innerHTML = '';

        notifications.items.forEach(notification => {
            const notificationElement = document.createElement('div');
            notificationElement.className = `rounded-3xl p-4 fade-in ios-press liquid-glass-card notification-item`;
            notificationElement.setAttribute('data-type', notification.type);
            notificationElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex space-x-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center liquid-glass ${notification.icon}">
                            <i class="fas ${notification.type === 'system' ? 'fa-satellite-dish' :
                                          notification.type === 'reminder' ? 'fa-check-circle' :
                                          notification.type === 'alert' ? 'fa-radiation' : 'fa-solar-panel'}"></i>
                        </div>
                        <div>
                            <h3 class="font-medium">${notification.title}</h3>
                            <p class="text-white text-opacity-70 text-sm">${notification.message}</p>
                            <p class="text-white text-opacity-50 text-xs mt-1">${notification.time}</p>
                        </div>
                    </div>
                    ${notification.unread ? '<div class="w-2 h-2 bg-ios-blue rounded-full pulse-notification"></div>' : ''}
                </div>
            `;
            container.appendChild(notificationElement);
        });
    },

    // Загрузка данных настроек
    loadSettingsData() {
        const settings = appData.settings;
        const container = document.getElementById('settings-container');
        container.innerHTML = '';

        settings.sections.forEach(section => {
            const sectionElement = document.createElement('div');
            sectionElement.className = 'rounded-3xl p-4 fade-in liquid-glass-card';
            sectionElement.innerHTML = `
                <h2 class="font-medium mb-3">${section.title}</h2>
                <div class="space-y-3">
                    ${section.items.map(item => `
                        <div class="flex justify-between items-center ios-press ${item.type === 'toggle' ? 'toggle-setting' : ''}"
                             data-id="${item.id}" data-type="${item.type}">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 rounded-full flex items-center justify-center liquid-glass ${item.icon}">
                                    <i class="fas ${item.name.includes('Связь') ? 'fa-wifi' :
                                                  item.name.includes('Экипаж') ? 'fa-user-astronaut' :
                                                  item.name.includes('Коды') ? 'fa-key' :
                                                  item.name.includes('Музыка') ? 'fa-music' :
                                                  item.name.includes('Навигация') ? 'fa-map-marked-alt' :
                                                  item.name.includes('Траектория') ? 'fa-rocket' : 'fa-moon'}"></i>
                                </div>
                                <p>${item.name}</p>
                            </div>
                            ${item.type === 'theme' ?
                                `<div class="flex items-center space-x-2">
                                    <span class="text-white text-opacity-70 text-sm" id="theme-status">${item.value}</span>
                                    <div class="theme-toggle active" id="theme-toggle"></div>
                                </div>` :
                                item.type === 'toggle' ?
                                `<p class="text-white text-opacity-70" id="setting-${item.id}">${item.value}</p>` :
                                `<i class="fas fa-chevron-right text-white text-opacity-50"></i>`
                            }
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(sectionElement);
        });
    },

    // Инициализация чекбоксов напоминаний
    initReminderCheckboxes() {
        const checkboxes = document.querySelectorAll('.reminder-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('click', function() {
                const taskId = parseInt(this.getAttribute('data-id'));
                const task = appData.reminders.tasks.find(t => t.id === taskId);
                if (task) {
                    task.completed = !task.completed;
                    this.loadRemindersData();
                }
            }.bind(this));
        });
    },

    // Инициализация всех данных
    initAllData() {
        this.loadWeatherData();
        this.loadCalendarData();
        this.loadRemindersData();
        this.loadSystemsData();
        this.loadMusicData();
        this.loadSearchData();
        this.loadNotificationsData();
        this.loadSettingsData();
    }
};