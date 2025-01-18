package io.gray.notification

import com.google.auth.oauth2.GoogleCredentials
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.Message
import com.google.firebase.messaging.WebpushConfig
import com.google.firebase.messaging.WebpushNotification
import io.micronaut.context.env.Environment
import jakarta.annotation.PostConstruct
import jakarta.inject.Inject
import jakarta.inject.Singleton
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import reactor.core.publisher.Mono
import reactor.core.scheduler.Schedulers


@Singleton
class NotificationService {
    companion object {
        val logger: Logger = LoggerFactory.getLogger(this::class.java)
    }

    @Inject
    lateinit var environment: Environment
    lateinit var firebaseApp: FirebaseApp

    @PostConstruct
    fun init() {
        if (!environment.activeNames.contains("test")) {
            val options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.getApplicationDefault())
                .setDatabaseUrl("https://light-the-lamp-3bb33.firebaseio.com/")
                .build()

            firebaseApp = FirebaseApp.initializeApp(options)
        }
    }


    fun sendNotification(token: String, title: String, body: String): Mono<String> {
        val message: Message = Message.builder()
            .setToken(token)
            .setWebpushConfig(
                WebpushConfig.builder().setNotification(
                    WebpushNotification.builder().setBody(body).setTitle(title).setIcon("/pwa-512x512.png").build()
                ).build()
            )
            .build()
        return Mono.fromRunnable<String> { FirebaseMessaging.getInstance(firebaseApp).send(message) }
            .subscribeOn(Schedulers.boundedElastic())
    }
}