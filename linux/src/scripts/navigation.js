// Переключение страниц
export function switchPage(pageId) {
    // Скрыть все страницы
    document.querySelectorAll('.stacked-page').forEach(page => {
        page.classList.remove('active', 'previous');
    });
    
    // Показать выбранную страницу
    const activePage = document.getElementById(`${pageId}-page`);
    if (activePage) {
        activePage.classList.add('active');
    }
    
    // Обновить кнопки bottom bar
    document.querySelectorAll('#home-btn, #tests-btn, #settings-btn').forEach(btn => {
        btn.classList.remove('glass-selected');
    });
    
    const pageButton = document.getElementById(`${pageId}-btn`);
    if (pageButton) {
        pageButton.classList.add('glass-selected');
    }
}