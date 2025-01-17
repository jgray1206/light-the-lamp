package io.gray.notification

import com.google.auth.oauth2.GoogleCredentials
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.Message
import com.google.firebase.messaging.Notification
import io.micronaut.context.env.Environment
import jakarta.annotation.PostConstruct
import jakarta.inject.Inject
import jakarta.inject.Singleton
import org.slf4j.Logger
import org.slf4j.LoggerFactory


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


    fun sendNotification(token: String, title: String, body: String) {
        val message: Message = Message.builder()
            .setNotification(Notification.builder().setBody(body).setTitle(title).setImage("/logo.png").build())
            .setToken(token)
            .build()
        val response = FirebaseMessaging.getInstance(firebaseApp).send(message)
        logger.info(response)
    }
}