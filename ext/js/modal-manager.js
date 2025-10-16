// Менеджер модальных окон
const ModalManager = {
    initAccessCodes() {
        const modal = document.getElementById('access-codes-modal');
        const openBtn = document.getElementById('access-codes-btn');
        const closeBtn = document.getElementById('close-codes-modal');
        const submitBtn = document.getElementById('submit-code');
        const codeInputs = document.querySelectorAll('.code-input');
        const errorMsg = document.getElementById('code-error');

        // Правильный код доступа
        const correctCode = '123456';

        // Функция открытия модального окна
        function openModal() {
            modal.classList.add('active');
            if (codeInputs[0]) codeInputs[0].focus();
        }

        // Функция закрытия модального окна
        function closeModal() {
            modal.classList.remove('active');
            resetCodeInputs();
        }

        // Открытие модального окна
        if (openBtn) {
            openBtn.addEventListener('click', openModal);
        }

        // Закрытие модального окна по крестику
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        // Закрытие по клику на overlay
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeModal();
                }
            });
        }

        // Закрытие по Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
                closeModal();
            }
        });

        // Обработка ввода кода
        codeInputs.forEach((input, index) => {
            input.addEventListener('input', function() {
                if (errorMsg) errorMsg.classList.add('hidden');

                // Автопереход к следующему полю
                if (this.value.length === 1 && index < codeInputs.length - 1) {
                    codeInputs[index + 1].focus();
                }
            });

            // Обработка Backspace
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && this.value.length === 0 && index > 0) {
                    codeInputs[index - 1].focus();
                }
            });
        });

        // Проверка кода
        if (submitBtn) {
            submitBtn.addEventListener('click', function() {
                const enteredCode = Array.from(codeInputs).map(input => input.value).join('');

                if (enteredCode === correctCode) {
                    alert('Код доступа принят! Доступ разрешен.');
                    closeModal();
                } else {
                    if (errorMsg) errorMsg.classList.remove('hidden');
                    resetCodeInputs();
                    if (codeInputs[0]) codeInputs[0].focus();
                }
            });
        }

        // Сброс полей ввода
        function resetCodeInputs() {
            codeInputs.forEach(input => {
                input.value = '';
            });
            if (errorMsg) errorMsg.classList.add('hidden');
        }
    }
};