plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.example.panga_pangisha"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11

        // ✅ Kotlin DSL correct syntax
        isCoreLibraryDesugaringEnabled = true
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        applicationId = "com.example.panga_pangisha"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    buildTypes {
        getByName("release") {
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

dependencies {
    // ✅ Kotlin DSL correct syntax for desugaring
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4") // flutter_local_notifications needs 2.1.4+

    // Replace `$kotlin_version` if it's undefined, or define it at the top of build.gradle.kts
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.9.0")
}

flutter {
    source = "../.."
}
