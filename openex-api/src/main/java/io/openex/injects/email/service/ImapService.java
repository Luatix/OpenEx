package io.openex.injects.email.service;


import io.openex.database.model.Communication;
import io.openex.database.model.Inject;
import io.openex.database.model.Setting;
import io.openex.database.model.User;
import io.openex.database.repository.CommunicationRepository;
import io.openex.database.repository.InjectRepository;
import io.openex.database.repository.SettingRepository;
import io.openex.database.repository.UserRepository;
import io.openex.service.FileService;
import org.apache.commons.mail.util.MimeMessageParser;
import org.apache.hc.client5.http.ClientProtocolException;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.hc.core5.http.message.BasicHeader;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mchange.rmi.NotAuthorizedException;

import javax.activation.DataSource;
import javax.mail.*;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static java.lang.Integer.parseInt;
import static java.time.Instant.now;

@Service
public class ImapService {

    private static final Logger LOGGER = Logger.getLogger(ImapService.class.getName());
    private final static Pattern INJECT_ID_PATTERN = Pattern.compile("\\[inject_id=(.*)\\]");
    private final static String PROVIDER = "imap";

    private Store imapStore;

    @Value("${openex.mail.imap.enabled}")
    private boolean enabled;

    @Value("${openex.mail.imap.host}")
    private String host;

    @Value("${openex.mail.imap.port}")
    private Integer port;

    @Value("${openex.mail.imap.username}")
    private String username;

    @Value("${openex.mail.imap.password}")
    private String password;

    @Value("${openex.mail.imap.tenantId}")
    private String tenantId;

    @Value("${openex.mail.imap.clientId}")
    private String clientId;

    @Value("${openex.mail.imap.clientSecret}")
    private String clientSecret;

    @Value("${openex.mail.imap.o365AuthModeEnabled}")
    private boolean o365AuthModeEnabled;

    @Value("${openex.mail.imap.inbox}")
    private List<String> inboxFolders;

    @Value("${openex.mail.imap.sent}")
    private String sentFolder;

    private UserRepository userRepository;
    private InjectRepository injectRepository;
    private CommunicationRepository communicationRepository;
    private SettingRepository settingRepository;
    private FileService fileService;

    public ImapService(Environment env) throws Exception {
        initStore(env);
    }

    @Autowired
    public void setFileService(FileService fileService) {
        this.fileService = fileService;
    }

    @Autowired
    public void setSettingRepository(SettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    @Autowired
    public void setInjectRepository(InjectRepository injectRepository) {
        this.injectRepository = injectRepository;
    }

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Autowired
    public void setCommunicationRepository(CommunicationRepository communicationRepository) {
        this.communicationRepository = communicationRepository;
    }

    private void initStore(Environment env) throws Exception {
        Session session = Session.getDefaultInstance(buildProperties(env), null);
        if (env.getProperty("openex.mail.imap.debug", Boolean.class, false)){
            session.setDebug(true);
        }
        imapStore = session.getStore(PROVIDER);
        String host = env.getProperty("openex.mail.imap.host");
        int port = env.getProperty("openex.mail.imap.port", Integer.class, 995);
        String username = env.getProperty("openex.mail.imap.username");
        String password = env.getProperty("openex.mail.imap.password");
        boolean o365AuthModeEnabled = env.getProperty("openex.mail.imap.o365AuthModeEnabled", Boolean.class, false);
        String clientId = env.getProperty("openex.mail.imap.clientId");
        String clientSecret = env.getProperty("openex.mail.imap.clientSecret");
        String tenantId = env.getProperty("openex.mail.imap.tenantId");

        boolean isEnabled = env.getProperty("openex.mail.imap.enabled", Boolean.class, false);
        if (isEnabled) {
            LOGGER.log(Level.INFO, "IMAP sync started");
            if (o365AuthModeEnabled) {
                LOGGER.log(Level.INFO, "IMAP sync O365 mode");
                String token = getAuthToken(tenantId, clientId, clientSecret);
                LOGGER.log(Level.INFO, "token retrieved");
                imapStore.connect(host, username, token);
                // test immediatly the folder, because MS accept AUTHENTICATE but refuse just after with "BAD User is authenticated but not connected"
                // test now to avoid an error message in planned task
                LOGGER.log(Level.INFO, "O365 connection successfull. Opening inbox to ensure user has IMAP access right, no MFA enforced.");
                String indoxFolder = env.getProperty("openex.mail.imap.inbox");
                Folder folder = imapStore.getFolder(indoxFolder);
                folder.open(Folder.READ_ONLY);
                folder.close();
            }
            else
            {
                imapStore.connect(host, port, username, password);
            }
        } else {
            LOGGER.log(Level.INFO, "IMAP sync disabled");
        }
    }

    private String getTextFromMimeMultipart(MimeMultipart mimeMultipart) throws MessagingException, IOException {
        StringBuilder result = new StringBuilder();
        int count = mimeMultipart.getCount();
        for (int i = 0; i < count; i++) {
            BodyPart bodyPart = mimeMultipart.getBodyPart(i);
            if (bodyPart.isMimeType("text/plain")) {
                result.append(bodyPart.getContent());
                break;
            } else if (bodyPart.getContent() instanceof MimeMultipart) {
                result.append(getTextFromMimeMultipart((MimeMultipart) bodyPart.getContent()));
            }
        }
        return result.toString();
    }

    private String getHtmlFromMimeMultipart(MimeMultipart mimeMultipart) throws MessagingException, IOException {
        StringBuilder result = new StringBuilder();
        int count = mimeMultipart.getCount();
        for (int i = 0; i < count; i++) {
            BodyPart bodyPart = mimeMultipart.getBodyPart(i);
            if (bodyPart.isMimeType("text/html")) {
                result.append((String) bodyPart.getContent());
                break;
            } else if (bodyPart.getContent() instanceof MimeMultipart) {
                result.append(getHtmlFromMimeMultipart((MimeMultipart) bodyPart.getContent()));
            }
        }
        return result.toString();
    }

    private String getTextFromMessage(Message message) throws MessagingException, IOException {
        String result = "";
        if (message.isMimeType("multipart/*")) {
            MimeMultipart mimeMultipart = (MimeMultipart) message.getContent();
            result = getTextFromMimeMultipart(mimeMultipart);
        } else if (message.isMimeType("text/plain")) {
            result = message.getContent().toString();
        }
        return result;
    }

    private String getHtmlFromMessage(Message message) throws MessagingException, IOException {
        String result = "";
        if (message.isMimeType("multipart/*")) {
            MimeMultipart mimeMultipart = (MimeMultipart) message.getContent();
            result = getHtmlFromMimeMultipart(mimeMultipart);
        } else if (message.isMimeType("text/html")) {
            result = message.getContent().toString();
        }
        return result;
    }

    private Properties buildProperties(Environment env) {
        String sslEnable = env.getProperty("openex.mail.imap.ssl.enable");
        String sslTrust = env.getProperty("openex.mail.imap.ssl.trust");
        String sslAuth = env.getProperty("openex.mail.imap.auth");
        String sslStartTLS = env.getProperty("openex.mail.imap.starttls.enable");
        Properties props = new Properties();
        props.setProperty("mail.imap.ssl.enable", sslEnable);
        props.setProperty("mail.imap.ssl.trust", sslTrust);
        props.setProperty("mail.imap.auth", sslAuth);
        props.setProperty("mail.imap.starttls.enable", sslStartTLS);

        boolean o365AuthModeEnabled = env.getProperty("openex.mail.imap.o365AuthModeEnabled", Boolean.class, false);
        if (o365AuthModeEnabled)
        {
            props.put("mail.imap.ssl.enable", "true");
            props.put("mail.imap.starttls.enable", "true");
            props.put("mail.imap.auth", "true");
            props.put("mail.imap.auth.mechanisms", "XOAUTH2");

            String mailAddress = env.getProperty("openex.mail.imap.username");
            props.put("mail.imap.user", mailAddress);
        }
        if (env.getProperty("openex.mail.imap.debug", Boolean.class, false)){
            props.put("mail.debug", "true");
            props.put("mail.debug.auth", "true");
        }
        return props;
    }

    private List<String> computeParticipants(Message message) throws Exception {
        List<String> from = new ArrayList<String>();
        List<String> recipients = new ArrayList<String>();
        Address[] fromMessage = message.getFrom();
        if(fromMessage != null)
        {
            from = Arrays.stream(fromMessage).map(addr -> (((InternetAddress) addr).getAddress())).toList();
        }
        Address[] recipientsMessage = message.getAllRecipients();
        if (recipientsMessage != null)
        {
            recipients = Arrays.stream(recipientsMessage).map(addr -> (((InternetAddress) addr).getAddress())).toList();
        }
        return Stream.concat(from.stream(), recipients.stream()).map(String::toLowerCase).filter(recipient -> !recipient.equals(username)).distinct().toList();
    }

    private Inject injectResolver(String content, String contentHtml) {
        Matcher matcher = content.length() > 10
                ? INJECT_ID_PATTERN.matcher(content) : INJECT_ID_PATTERN.matcher(contentHtml);
        if (matcher.find()) {
            String injectId = matcher.group(1);
            return injectRepository.findById(injectId).orElse(null);
        }
        return null;
    }

    private void parseMessages(Message[] messages, Boolean isSent) throws Exception {
        for (Message message : messages) {
            MimeMessage mimeMessage = (MimeMessage) message;
            String messageID = mimeMessage.getMessageID();
            boolean messageAlreadyAvailable = communicationRepository.existsByIdentifier(messageID);
            if (!messageAlreadyAvailable) {
                String content = getTextFromMessage(message);
                String contentHtml = getHtmlFromMessage(message);
                Inject inject = injectResolver(content, contentHtml);
                List<String> participants = computeParticipants(message);
                List<User> users = userRepository.findAllByEmailIn(participants);
                if (inject != null && users.size() > 0) {
                    String subject = message.getSubject();
                    String from = String.valueOf(Arrays.stream(message.getFrom()).toList().get(0));
                    String to = String.valueOf(Arrays.stream(message.getAllRecipients()).toList());
                    Date receivedDate = message.getReceivedDate();
                    Date sentDate = message.getSentDate();
                    // Save messaging
                    Communication communication = new Communication();
                    communication.setReceivedAt(receivedDate.toInstant());
                    communication.setSentAt(sentDate.toInstant());
                    communication.setSubject(subject);
                    communication.setContent(content);
                    communication.setContentHtml(contentHtml);
                    communication.setIdentifier(messageID);
                    communication.setUsers(users);
                    communication.setInject(inject);
                    communication.setAnimation(isSent);
                    communication.setFrom(from);
                    communication.setTo(to);
                    try {
                        // Save the communication
                        Communication comm = communicationRepository.save(communication);
                        // Update inject for real time
                        inject.setUpdatedAt(now());
                        injectRepository.save(inject);
                        // Upload attachments in communication
                        final MimeMessageParser mimeParser = new MimeMessageParser(mimeMessage).parse();
                        final List<DataSource> attachmentList = mimeParser.getAttachmentList();
                        final List<String> uploads = new ArrayList<>();
                        String exerciseId = inject.getExercise().getId();
                        for (DataSource dataSource : attachmentList) {
                            final String fileName = dataSource.getName();
                            String path = "/" + exerciseId + "/communications/" + comm.getId();
                            String uploadName = fileService.uploadStream(path, fileName, dataSource.getInputStream());
                            uploads.add(uploadName);
                        }
                        // Add attachment in the communication
                        comm.setAttachments(uploads.toArray(String[]::new));
                        communicationRepository.save(comm);
                    } catch (Exception e) {
                        LOGGER.log(Level.SEVERE, e.getMessage(), e);
                    }
                }
            }
        }
    }

    private void synchronizeBox(Folder inbox, Boolean isSent) throws Exception {
        String inboxKey = username + "-imap-" + inbox.getName();
        Optional<Setting> state = settingRepository.findByKey(inboxKey);
        Setting currentState = state.orElse(null);
        if (currentState == null) {
            currentState = settingRepository.save(new Setting(inboxKey, "0"));
        }
        int startMessageNumber = parseInt(currentState.getValue());
        int messageCount = inbox.getMessageCount();
        if (startMessageNumber < messageCount) {
            LOGGER.log(Level.INFO, "synchronizeInbox " + inbox.getName() + " from " + startMessageNumber + " to " + messageCount);
            int start = startMessageNumber + 1;
            Message[] messages = inbox.getMessages(start, messageCount);
            if (messages.length > 0) {
                parseMessages(messages, isSent);
            }
        }
        currentState.setValue(String.valueOf(messageCount));
        settingRepository.save(currentState);
    }

    private void syncFolders() throws Exception {
        // Sync sent
        Folder sentBox = imapStore.getFolder(sentFolder);
        sentBox.open(Folder.READ_ONLY);
        synchronizeBox(sentBox, true);
        sentBox.close();
        // Sync received
        for (String listeningFolder : inboxFolders) {
            Folder inbox = imapStore.getFolder(listeningFolder);
            inbox.open(Folder.READ_ONLY);
            synchronizeBox(inbox, false);
            inbox.close();
        }
    }

    // Sync folders every 10 sec
    @Scheduled(fixedDelay = 10000, initialDelay = 10000)
    public void connectionListener() throws Exception {
        if (enabled) {
            if (!imapStore.isConnected()) {
                
                if (o365AuthModeEnabled) {
                    String token = getAuthToken(tenantId, clientId, clientSecret);
                    imapStore.connect(host, username, token);
                } else {
                    imapStore.connect(host, port, username, password);
                }
            }
            syncFolders();
        }
    }

    public void storeSentMessage(MimeMessage message) throws Exception {
        if (enabled) {
            Folder folder = imapStore.getFolder(sentFolder);
            folder.open(Folder.READ_WRITE);
            message.setFlag(Flags.Flag.SEEN, true);
            folder.appendMessages(new Message[]{message});
            folder.close();
        }
    }

    public String getAuthToken(String tenantId,String clientId,String client_secret) throws ClientProtocolException, IOException, NotAuthorizedException {
        CloseableHttpClient client = HttpClients.createDefault();
        HttpPost loginPost = new HttpPost("https://login.microsoftonline.com/" + tenantId + "/oauth2/v2.0/token");
        String scopes = "https://outlook.office365.com/.default";
        String encodedBody = "client_id=" + clientId + "&scope=" + scopes + "&client_secret=" + client_secret
                + "&grant_type=client_credentials";
        loginPost.setEntity(new StringEntity(encodedBody, ContentType.APPLICATION_FORM_URLENCODED));
        loginPost.addHeader(new BasicHeader("cache-control", "no-cache"));
        CloseableHttpResponse loginResponse = client.execute(loginPost);
        InputStream inputStream = loginResponse.getEntity().getContent();
        byte[] response = inputStream.readAllBytes();
        
        ObjectMapper objectMapper = new ObjectMapper();
        JavaType type = objectMapper.constructType(
                objectMapper.getTypeFactory().constructParametricType(Map.class, String.class, String.class));
        Map<String, String> parsed = new ObjectMapper().readValue(response, type);
        if (parsed.containsKey("error"))
        {
            String fullResponse = new String(response);
            throw new NotAuthorizedException("Unable to authenticate to O365. Message: " + fullResponse);
        }
        if (!parsed.containsKey("access_token"))
        {
            String fullResponse = new String(response);
            throw new NotAuthorizedException("Unable to authenticate to O365. No access token found in response: " + fullResponse);
        }
        return parsed.get("access_token");
    }
}
