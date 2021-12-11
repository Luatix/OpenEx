package io.openex.player.injects.email;

import io.openex.player.injects.email.model.EmailAttachment;
import io.openex.player.injects.email.model.EmailContent;
import io.openex.player.injects.email.service.EmailService;
import io.openex.player.model.database.Injection;
import io.openex.player.model.execution.ExecutableInject;
import io.openex.player.model.execution.Execution;
import io.openex.player.model.execution.ExecutionStatus;
import io.openex.player.model.execution.UserInjectContext;
import io.openex.player.model.Executor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.logging.Level;
import java.util.logging.Logger;

@Component
public class EmailExecutor implements Executor<EmailContent> {

    private static final Logger LOGGER = Logger.getLogger(EmailExecutor.class.getName());
    private EmailService emailService;

    @Autowired
    public void setEmailService(EmailService emailService) {
        this.emailService = emailService;
    }

    @Override
    public void process(ExecutableInject<EmailContent> injection, Execution execution) throws Exception {
        Injection<EmailContent> inject = injection.getInject();
        EmailContent content = inject.getContent();
        String subject = content.getSubject();
        String message = inject.getMessage();
        // Resolve the attachments only once
        List<EmailAttachment> attachments = emailService.resolveAttachments(execution, content.getAttachments());
        List<UserInjectContext> users = injection.getUsers();
        int numberOfExpected = users.size();
        AtomicInteger errors = new AtomicInteger(0);
        for (UserInjectContext user : users) {
            String email = user.getUser().getEmail();
            String replyTo = user.getExercise().getReplyTo();
            try {
                emailService.sendEmail(user, replyTo, subject, message, attachments);
                execution.addMessage("Mail sent to " + email);
            } catch (Exception e) {
                LOGGER.log(Level.SEVERE, e.getMessage(), e);
                errors.incrementAndGet();
                execution.addMessage(e.getMessage());
            }
        }
        // users.stream().parallel().forEach(user -> {
        //     String email = user.getUser().getEmail();
        //     try {
        //         Map<String, Object> model = injectHelper.buildInjectTemplateModel(inject.getExercise(), user);
        //         emailService.sendEmail(user, replyTo, subject, message, attachments, model);
        //         execution.addMessage("Mail sent to " + email);
        //     } catch (Exception e) {
        //         LOGGER.log(Level.SEVERE, e.getMessage(), e);
        //         errors.incrementAndGet();
        //         execution.addMessage(e.getMessage());
        //     }
        // });
        int numberOfErrors = errors.get();
        if (numberOfErrors > 0) {
            ExecutionStatus status = numberOfErrors == numberOfExpected ? ExecutionStatus.ERROR : ExecutionStatus.PARTIAL;
            execution.setStatus(status);
        }
    }
}
