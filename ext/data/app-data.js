// JSON структуры данных для виджетов
const appData = {
    weather: {
        location: "Орбита Земли",
        temperature: "-270°",
        description: "Вакуум",
        solarWind: "450 км/с",
        radiation: "Низкая",
        updateTime: "2 мин назад"
    },
    calendar: {
        events: [
            {
                id: 1,
                title: "Выход в открытый космос",
                date: "15",
                time: "10:00 - 11:30",
                icon: "icon-gradient-1"
            },
            {
                id: 2,
                title: "Коррекция орбиты",
                date: "16",
                time: "14:20 - 15:00",
                icon: "icon-gradient-2"
            }
        ]
    },
    reminders: {
        tasks: [
            {
                id: 1,
                text: "Проверить системы жизнеобеспечения",
                completed: false
            },
            {
                id: 2,
                text: "Калибровка навигационных приборов",
                completed: false
            },
            {
                id: 3,
                text: "Связь с ЦУП",
                completed: false
            }
        ]
    },
    systems: {
        status: [
            { name: "Кислород", status: "normal" },
            { name: "Энергия", status: "normal" },
            { name: "Связь", status: "warning" },
            { name: "Температура", status: "normal" }
        ],
        power: {
            level: 75,
            timeToRecharge: "12 дней"
        }
    },
    music: {
        currentTrack: "Space Oddity - David Bowie",
        isPlaying: false,
        progress: 30,
        duration: "3:45"
    },
    search: {
        recent: [
            { id: 1, text: "Системы навигации", icon: "icon-gradient-3" },
            { id: 2, text: "Системы жизнеобеспечения", icon: "icon-gradient-2" },
            { id: 3, text: "Связь с Землей", icon: "icon-gradient-6" }
        ],
        quickAccess: [
            { id: 1, name: "Главная", icon: "icon-gradient-1", section: "home-section" },
            { id: 2, name: "Уведомления", icon: "icon-gradient-4", section: "notifications-section" },
            { id: 3, name: "Настройки", icon: "icon-gradient-3", section: "settings-section" },
            { id: 4, name: "Авария", icon: "icon-gradient-6", section: "emergency" }
        ]
    },
    notifications: {
        items: [
            {
                id: 1,
                type: "system",
                title: "Связь с ЦУП",
                message: "Установлена устойчивая связь",
                time: "2 мин назад",
                icon: "icon-gradient-3",
                unread: true
            },
            {
                id: 2,
                type: "reminder",
                title: "Задача выполнена",
                message: "Проверить системы выполнено",
                time: "10 мин назад",
                icon: "icon-gradient-2",
                unread: false
            }
        ]
    },
    settings: {
        sections: [
            {
                title: "Основные системы",
                items: [
                    {
                        id: 1,
                        name: "Связь с Землей",
                        value: "Активна",
                        icon: "icon-gradient-3",
                        type: "toggle"
                    },
                    {
                        id: 2,
                        name: "Внутренняя связь",
                        value: "Вкл.",
                        icon: "icon-gradient-2",
                        type: "toggle"
                    },
                    {
                        id: 3,
                        name: "Тема интерфейса",
                        value: "Космос",
                        icon: "icon-gradient-4",
                        type: "theme"
                    }
                ]
            }
        ]
    }
};