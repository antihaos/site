# NewRec - Приложение для отображения карточек товаров

Приложение Android на Kotlin Multiplatform для отображения карточек товаров.

## Структура проекта

- `shared/` - общий модуль с бизнес-логикой и UI компонентами
  - `Product.kt` - модель данных товара
  - `ProductRepository.kt` - репозиторий для работы с JSON данными
  - `ui/ProductCard.kt` - компонент карточки товара
  - `ui/ProductListScreen.kt` - экран со списком товаров

- `androidApp/` - Android приложение
  - `MainActivity.kt` - главная активность

## Данные

Описание товаров хранится в формате JSON (`products.json`). Пример структуры:

```json
[
    {
        "id": 1,
        "name": "Название товара",
        "description": "Описание товара",
        "price": 9999.0,
        "imageUrl": "https://example.com/image.jpg"
    }
]
```

## Сборка и запуск

Для сборки проекта используйте Android Studio или команду:

```bash
./gradlew assembleDebug
```

## Технологии

- Kotlin Multiplatform
- Jetpack Compose
- Kotlinx Serialization (для парсинга JSON)
- Material 3 Design
