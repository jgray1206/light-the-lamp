package io.gray.email

import com.google.api.client.auth.oauth2.Credential
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport
import com.google.api.client.googleapis.json.GoogleJsonResponseException
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.JsonFactory
import com.google.api.client.json.gson.GsonFactory
import com.google.api.client.util.store.FileDataStoreFactory
import com.google.api.services.gmail.Gmail
import com.google.api.services.gmail.GmailScopes
import com.google.api.services.gmail.model.Message
import io.micronaut.context.annotation.Value
import jakarta.inject.Singleton
import jakarta.mail.Session
import jakarta.mail.internet.InternetAddress
import jakarta.mail.internet.MimeMessage
import java.io.*
import java.util.*
import org.apache.commons.codec.binary.Base64

@Singleton
class MailService(
        @Value("\${credential.path}")
        private val credPath: String,
        @Value("\${token.path}")
        private val tokenPath: String
) {
    /**
     * Global instance of the JSON factory.
     */
    private val JSON_FACTORY: JsonFactory = GsonFactory.getDefaultInstance()

    /**
     * Creates an authorized Credential object.
     *
     * @param httpTransport The network HTTP Transport.
     * @return An authorized Credential object.
     * @throws IOException If the credentials.json file cannot be found.
     */
    private fun getCredentials(httpTransport: NetHttpTransport): Credential {
        // Load client secrets.
        val `in` = File(credPath).inputStream()
        val clientSecrets: GoogleClientSecrets = GoogleClientSecrets.load(JSON_FACTORY, InputStreamReader(`in`))

        // Build flow and trigger user authorization request.
        val flow: GoogleAuthorizationCodeFlow = GoogleAuthorizationCodeFlow.Builder(
                httpTransport, JSON_FACTORY, clientSecrets, listOf(GmailScopes.GMAIL_SEND))
                .setDataStoreFactory(FileDataStoreFactory(File(tokenPath)))
                .setAccessType("offline")
                .build()
        val receiver: LocalServerReceiver = LocalServerReceiver.Builder().setPort(8888).build()
        //returns an authorized Credential object.
        return AuthorizationCodeInstalledApp(flow, receiver).authorize("user")
    }

    fun sendEmail(toEmailAddress: String, messageSubject: String, bodyText: String): Message? {
        // Build a new authorized API client service.
        val httpTransport: NetHttpTransport = GoogleNetHttpTransport.newTrustedTransport()
        val service: Gmail = Gmail.Builder(httpTransport, JSON_FACTORY, getCredentials(httpTransport))
                .setApplicationName("Light The Lamp")
                .build()

        // Encode as MIME message
        val props = Properties()
        val session = Session.getDefaultInstance(props, null)
        val email = MimeMessage(session)
        email.setFrom(InternetAddress("grayio.lightthelamp@gmail.com"))
        email.addRecipient(jakarta.mail.Message.RecipientType.TO,
                InternetAddress(toEmailAddress))
        email.subject = messageSubject
        email.setText(bodyText)

        // Encode and wrap the MIME message into a gmail message
        val buffer = ByteArrayOutputStream()
        email.writeTo(buffer)
        val rawMessageBytes = buffer.toByteArray()
        val encodedEmail: String = Base64.encodeBase64URLSafeString(rawMessageBytes)
        var message = Message()
        message.raw = encodedEmail
        try {
            // Create send message
            message = service.users().messages().send("me", message).execute()
            println("Message id: " + message.getId())
            println(message.toPrettyString())
            return message
        } catch (e: GoogleJsonResponseException) {
            val error = e.details
            if (error.code == 403) {
                System.err.println("Unable to send message: " + e.details)
            } else {
                throw e
            }
        }
        return null
    }
}