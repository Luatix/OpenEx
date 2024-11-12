package io.openbas.injectors.email.service;

import static java.lang.Integer.parseInt;
import static java.time.Instant.now;

import io.openbas.database.model.*;
import io.openbas.database.repository.CommunicationRepository;
import io.openbas.database.repository.InjectRepository;
import io.openbas.database.repository.SettingRepository;
import io.openbas.database.repository.UserRepository;
import io.openbas.service.FileService;
import io.openbas.service.PlatformSettingsService;
import jakarta.activation.DataSource;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import java.io.IOException;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import lombok.extern.java.Log;
import org.apache.commons.mail.util.MimeMessageParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@Log
public class ImapService {

  private static final Logger LOGGER = Logger.getLogger(ImapService.class.getName());
  private static final Pattern INJECT_ID_PATTERN = Pattern.compile("\\[inject_id=(.*)\\]");
  private static final String PROVIDER = "imap";

  private Store imapStore;

  @Value("${openbas.mail.imap.enabled}")
  private boolean enabled;

  @Value("${openbas.mail.imap.host}")
  private String host;

  @Value("${openbas.mail.imap.port}")
  private Integer port;

  @Value("${openbas.mail.imap.username}")
  private String username;

  @Value("${openbas.mail.imap.password}")
  private String password;

  @Value("${openbas.mail.imap.inbox}")
  private List<String> inboxFolders;

  @Value("${openbas.mail.imap.sent}")
  private String sentFolder;

  private UserRepository userRepository;
  private InjectRepository injectRepository;
  private CommunicationRepository communicationRepository;
  private SettingRepository settingRepository;
  private FileService fileService;
  private final PlatformSettingsService platformSettingsService;

  public ImapService(Environment env, @Autowired PlatformSettingsService platformSettingsService) {
    this.platformSettingsService = platformSettingsService;
    try {
      initStore(env);
      this.platformSettingsService.cleanMessage(BannerMessage.BANNER_KEYS.IMAP_UNAVAILABLE);
    } catch (Exception e) {
      log.severe(e.getMessage());
      this.platformSettingsService.errorMessage(BannerMessage.BANNER_KEYS.IMAP_UNAVAILABLE);
    }
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
    imapStore = session.getStore(PROVIDER);
    String host = env.getProperty("openbas.mail.imap.host");
    int port = env.getProperty("openbas.mail.imap.port", Integer.class, 995);
    String username = env.getProperty("openbas.mail.imap.username");
    String password = env.getProperty("openbas.mail.imap.password");
    String sentFolder = env.getProperty("openbas.mail.imap.sent");
    boolean isEnabled = env.getProperty("openbas.mail.imap.enabled", Boolean.class, false);
    if (isEnabled) {
      LOGGER.log(Level.INFO, "IMAP sync started");
      imapStore.connect(host, port, username, password);
      try {
        Folder defaultFolder = imapStore.getDefaultFolder();
        Folder sentBox = defaultFolder.getFolder(sentFolder);
        if (!sentBox.exists()) {
          sentBox.create(Folder.READ_WRITE);
          sentBox.setSubscribed(true);
        }
      } catch (Exception e) {
        LOGGER.log(Level.SEVERE, e.getMessage(), e);
      }
    } else {
      LOGGER.log(Level.INFO, "IMAP sync disabled");
    }
  }

  private String getTextFromMimeMultipart(MimeMultipart mimeMultipart)
      throws MessagingException, IOException {
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

  private String getHtmlFromMimeMultipart(MimeMultipart mimeMultipart)
      throws MessagingException, IOException {
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
    String sslEnable = env.getProperty("openbas.mail.imap.ssl.enable");
    String sslTrust = env.getProperty("openbas.mail.imap.ssl.trust");
    String sslAuth = env.getProperty("openbas.mail.imap.auth");
    String sslStartTLS = env.getProperty("openbas.mail.imap.starttls.enable");
    Properties props = new Properties();
    props.setProperty("mail.imap.ssl.enable", sslEnable);
    props.setProperty("mail.imap.ssl.trust", sslTrust);
    props.setProperty("mail.imap.auth", sslAuth);
    props.setProperty("mail.imap.starttls.enable", sslStartTLS);
    return props;
  }

  private List<String> computeParticipants(Message message) throws Exception {
    List<String> from =
        Arrays.stream(message.getFrom())
            .map(addr -> (((InternetAddress) addr).getAddress()))
            .toList();
    List<String> recipients =
        Arrays.stream(message.getAllRecipients())
            .map(addr -> (((InternetAddress) addr).getAddress()))
            .toList();
    return Stream.concat(from.stream(), recipients.stream())
        .map(String::toLowerCase)
        .filter(recipient -> !recipient.equals(username))
        .distinct()
        .toList();
  }

  private Inject injectResolver(String content, String contentHtml) {
    Matcher matcher =
        content.length() > 10
            ? INJECT_ID_PATTERN.matcher(content)
            : INJECT_ID_PATTERN.matcher(contentHtml);
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
        List<User> users = userRepository.findAllByEmailInIgnoreCase(participants);
        if (inject != null && !users.isEmpty()) {
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
            String exerciseId = null;
            if (inject.getExercise() != null) {
              exerciseId = inject.getExercise().getId();
            }
            for (DataSource dataSource : attachmentList) {
              final String fileName = dataSource.getName();
              String path =
                  exerciseId != null
                      ? "/" + exerciseId + "/communications/" + comm.getId()
                      : "/communications/" + comm.getId();
              String uploadName =
                  fileService.uploadStream(path, fileName, dataSource.getInputStream());
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
      LOGGER.log(
          Level.INFO,
          "synchronizeInbox "
              + inbox.getName()
              + " from "
              + startMessageNumber
              + " to "
              + messageCount);
      int start = startMessageNumber + 1;
      Message[] messages = inbox.getMessages(start, messageCount);
      if (messages.length > 0) {
        parseMessages(messages, isSent);
      }
    }
    currentState.setValue(String.valueOf(messageCount));
    settingRepository.save(currentState);
  }

  private void tryToSynchronizeFolderFromBox(String folderName, Boolean isSent) throws Exception {
    try (Folder folderBox = imapStore.getFolder(folderName)) {
      folderBox.open(Folder.READ_ONLY);
      synchronizeBox(folderBox, isSent);
    }
  }

  private void syncFolders() throws Exception {
    for (int i = 0; i < 3; i++) {
      try {
        // Sync sent
        tryToSynchronizeFolderFromBox(sentFolder, true);
        // Sync received
        for (String listeningFolder : inboxFolders) {
          tryToSynchronizeFolderFromBox(listeningFolder, false);
        }
        break;
      } catch (MessagingException e) {
        log.warning("Connection failure: " + e.getMessage());
        // Retry logic or rethrow the exception
        Thread.sleep(2000);
        if (i == 2 && imapStore != null && !imapStore.isConnected()) {
          imapStore.close();
        }
      }
    }
  }

  // Sync folders every 10 sec
  @Scheduled(fixedDelay = 10000, initialDelay = 10000)
  public void connectionListener() throws Exception {
    if (enabled) {
      if (!imapStore.isConnected()) {
        try {
          imapStore.connect(host, port, username, password);
          this.platformSettingsService.cleanMessage(BannerMessage.BANNER_KEYS.IMAP_UNAVAILABLE);
        } catch (MessagingException e) {
          log.severe(e.getMessage());
          this.platformSettingsService.errorMessage(BannerMessage.BANNER_KEYS.IMAP_UNAVAILABLE);
        }
      }
      syncFolders();
    }
  }

  public void storeSentMessage(MimeMessage message) throws Exception {
    if (enabled) {
      try (Folder folder = imapStore.getFolder(sentFolder)) {
        folder.open(Folder.READ_WRITE);
        message.setFlag(Flags.Flag.SEEN, true);
        folder.appendMessages(new Message[] {message});
      }
    }
  }
}
