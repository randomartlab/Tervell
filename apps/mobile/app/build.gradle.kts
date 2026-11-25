plugins { id("com.android.application") }
android {
    namespace = "art.randomai.proma"
    compileSdk = 35
    defaultConfig {
        applicationId = "art.randomai.proma"
        minSdk = 26
        targetSdk = 35
        versionCode = 23
        versionName = "0.1.22"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    sourceSets.getByName("main").java.srcDir("../vendor/zxing-core/src/main/java")
    sourceSets.getByName("main").assets.srcDir("../vendor/notices")
    testOptions { unitTests.isReturnDefaultValues = false }
    buildTypes { getByName("release") { isMinifyEnabled = true; isShrinkResources = true; proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro") } }
}

dependencies {
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20240303")
}

val mobileBun = System.getenv("TERVELL_BUILD_BUN") ?: (System.getProperty("user.home") + if (System.getProperty("os.name").startsWith("Windows")) "/.bun/bin/bun.exe" else "/.bun/bin/bun")
val checkMobileClient by tasks.registering(Exec::class) {
    workingDir(rootProject.projectDir.parentFile.parentFile)
    commandLine(mobileBun, "run", "node_modules/typescript/bin/tsc", "-p", "apps/mobile/client/tsconfig.json")
}
val buildMobileClient by tasks.registering(Exec::class) {
    dependsOn(checkMobileClient)
    workingDir(rootProject.projectDir.parentFile.parentFile)
    commandLine(mobileBun, "run", "node_modules/vite/bin/vite.js", "build", "--config", "apps/mobile/client/vite.config.ts")
    inputs.dir(rootProject.file("client/src"))
    inputs.dir(rootProject.file("../electron/resources/default-features"))
    inputs.dir(rootProject.file("../electron/src/renderer/lib/third-party/paseo-client"))
    inputs.file(rootProject.file("client/index.html"))
    inputs.file(rootProject.file("client/vite.config.ts"))
    inputs.file(rootProject.file("client/license-notices.ts"))
    inputs.file(rootProject.file("../electron/src/renderer/components/plugins/native-timeline-policy.ts"))
    inputs.dir(rootProject.file("../electron/resources/third-party/paseo-client"))
    inputs.dir(rootProject.file("../electron/resources/third-party/default-features"))
    outputs.dir(file("src/main/assets/workbench"))
}
tasks.named("preBuild").configure { dependsOn(buildMobileClient) }
