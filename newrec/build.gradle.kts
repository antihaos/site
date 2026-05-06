plugins {
    kotlin("multiplatform") version "1.9.22" apply false
    id("com.android.application") version "8.2.0" apply false
    id("org.jetbrains.compose") version "1.5.12" apply false
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven("https://maven.pkg.jetbrains.space/public/p/compose/dev")
    }
}
