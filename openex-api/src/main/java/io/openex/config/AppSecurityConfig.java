package io.openex.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectReader;
import io.openex.database.model.User;
import io.openex.database.repository.UserRepository;
import io.openex.rest.user.form.user.CreateUserInput;
import io.openex.security.SsoRefererAuthenticationSuccessHandler;
import io.openex.security.TokenAuthenticationFilter;
import io.openex.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.saml2.core.Saml2Error;
import org.springframework.security.saml2.provider.service.authentication.OpenSaml4AuthenticationProvider;
import org.springframework.security.saml2.provider.service.authentication.Saml2AuthenticatedPrincipal;
import org.springframework.security.saml2.provider.service.authentication.Saml2Authentication;
import org.springframework.security.saml2.provider.service.authentication.Saml2AuthenticationException;
import org.springframework.security.saml2.provider.service.metadata.OpenSamlMetadataResolver;
import org.springframework.security.saml2.provider.service.registration.RelyingPartyRegistrationRepository;
import org.springframework.security.saml2.provider.service.servlet.filter.Saml2WebSsoAuthenticationFilter;
import org.springframework.security.saml2.provider.service.web.DefaultRelyingPartyRegistrationResolver;
import org.springframework.security.saml2.provider.service.web.RelyingPartyRegistrationResolver;
import org.springframework.security.saml2.provider.service.web.Saml2MetadataFilter;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;

import javax.annotation.Resource;
import java.io.IOException;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Stream;

import static io.openex.database.model.User.ROLE_ADMIN;
import static io.openex.database.model.User.ROLE_USER;
import static java.util.Optional.ofNullable;
import static org.springframework.util.StringUtils.hasLength;

@EnableWebSecurity
public class AppSecurityConfig extends WebSecurityConfigurerAdapter {

  private static final Logger LOGGER = Logger.getLogger(AppSecurityConfig.class.getName());

  private UserRepository userRepository;
  private UserService userService;
  private OpenExConfig openExConfig;
  private Environment env;

  @Resource
  protected ObjectMapper mapper;

  @Autowired
  public void setEnv(Environment env) {
    this.env = env;
  }

  @Autowired
  public void setOpenExConfig(OpenExConfig openExConfig) {
    this.openExConfig = openExConfig;
  }

  @Autowired
  public void setUserService(UserService userService) {
    this.userService = userService;
  }

  @Autowired
  public void setUserRepository(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Autowired
  private RelyingPartyRegistrationRepository relyingPartyRegistrationRepository;

  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http.addFilterBefore(tokenAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
        .requestCache()
        /**/.requestCache(new HttpSessionRequestCache())
        .and()
        .csrf()
        /**/.disable()
        .formLogin()
        /**/.disable()
        .authorizeRequests()
        /**/.antMatchers("/api/comcheck/**").permitAll()
        /**/.antMatchers("/api/player/**").permitAll()
        /**/.antMatchers("/api/settings").permitAll()
        /**/.antMatchers("/api/login").permitAll()
        /**/.antMatchers("/api/reset/**").permitAll()
        /**/.antMatchers("/api/**").authenticated()
        .and()
        .logout()
        /**/.invalidateHttpSession(true)
        /**/.deleteCookies("JSESSIONID", openExConfig.getCookieName())
        /**/.logoutSuccessUrl("/");

    if (openExConfig.isAuthOpenidEnable()) {
      http.oauth2Login().successHandler(new SsoRefererAuthenticationSuccessHandler());
    }

    if (openExConfig.isAuthSaml2Enable()) {
      DefaultRelyingPartyRegistrationResolver relyingPartyRegistrationResolver =
          new DefaultRelyingPartyRegistrationResolver(this.relyingPartyRegistrationRepository);
      Saml2MetadataFilter filter = new Saml2MetadataFilter(
          (RelyingPartyRegistrationResolver) relyingPartyRegistrationResolver,
          new OpenSamlMetadataResolver());

      OpenSaml4AuthenticationProvider authenticationProvider = getOpenSaml4AuthenticationProvider();

      http
          .addFilterBefore(filter, Saml2WebSsoAuthenticationFilter.class)
          .saml2Login()
          .authenticationManager(new ProviderManager(authenticationProvider))
          .successHandler(new SsoRefererAuthenticationSuccessHandler());
    }

    // Rewrite 403 code to 401
    http.exceptionHandling().authenticationEntryPoint((request, response, authException)
        -> response.setStatus(HttpStatus.UNAUTHORIZED.value()));
  }

  @Bean
  public TokenAuthenticationFilter tokenAuthenticationFilter() {
    return new TokenAuthenticationFilter();
  }

  private List<String> extractRolesFromToken(OAuth2AccessToken accessToken, String registrationId) {
    ObjectReader listReader = mapper.readerFor(new TypeReference<List<String>>() {
    });
    if (accessToken != null) {
      String rolesPathConfig = "openex.provider." + registrationId + ".roles_path";
      List<String> rolesPath = env.getProperty(rolesPathConfig, List.class, new ArrayList<String>());
      try {
        String[] chunks = accessToken.getTokenValue().split("\\.");
        Base64.Decoder decoder = Base64.getUrlDecoder();
        String payload = new String(decoder.decode(chunks[1]));
        JsonNode jsonNode = mapper.readTree(payload);
        return rolesPath.stream().map(path -> "/" + path.replaceAll("\\.", "/"))
            .flatMap(path -> {
              JsonNode arrayRoles = jsonNode.at(path);
              try {
                List<String> roles = listReader.readValue(arrayRoles);
                return roles.stream();
              } catch (IOException e) {
                return Stream.empty();
              }
            }).toList();
      } catch (Exception e) {
        LOGGER.log(Level.SEVERE, e.getMessage(), e);
      }
    }
    return new ArrayList<>();
  }

  public User userManagement(String emailAttribute, String registrationId, List<String> rolesFromToken,
      String firstName, String lastName) {
    String email = ofNullable(emailAttribute).orElseThrow();
    String rolesAdminConfig = "openex.provider." + registrationId + ".roles_admin";
    List<String> rolesAdmin = env.getProperty(rolesAdminConfig, List.class, new ArrayList<String>());
    boolean isAdmin = rolesAdmin.stream().anyMatch(rolesFromToken::contains);
    if (hasLength(email)) {
      Optional<User> optionalUser = userRepository.findByEmail(email);
      // If user not exists, create it
      if (optionalUser.isEmpty()) {
        CreateUserInput createUserInput = new CreateUserInput();
        createUserInput.setEmail(email);
        createUserInput.setFirstname(firstName);
        createUserInput.setLastname(lastName);
        createUserInput.setAdmin(isAdmin);
        return userService.createUser(createUserInput, 0);
      } else {
        // If user exists, update it
        User currentUser = optionalUser.get();
        currentUser.setFirstname(firstName);
        currentUser.setLastname(lastName);
        currentUser.setAdmin(isAdmin);
        return userService.updateUser(currentUser);
      }
    }
    return null;
  }

  public User userOauth2Management(OAuth2AccessToken accessToken, ClientRegistration clientRegistration,
      OAuth2User user) {
    String emailAttribute = user.getAttribute("email");
    String registrationId = clientRegistration.getRegistrationId();
    List<String> rolesFromToken = extractRolesFromToken(accessToken, registrationId);
    User userLogin = userManagement(emailAttribute, registrationId, rolesFromToken, user.getAttribute("given_name"),
        user.getAttribute("family_name"));

    if (userLogin != null) {
      return userLogin;
    }

    OAuth2Error authError = new OAuth2Error("invalid_token", "User conversion fail", "");
    throw new OAuth2AuthenticationException(authError);
  }

  public User userSaml2Management(Saml2AuthenticatedPrincipal user) {
    String emailAttribute = user.getFirstAttribute(
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress");
    String registrationId = user.getRelyingPartyRegistrationId();
    List<String> rolesFromToken = List.of(); // TODO extract roles
//    List<String> rolesFromToken = extractRolesFromToken(accessToken, registrationId);
    User userLogin = userManagement(emailAttribute, registrationId, rolesFromToken,
        user.getFirstAttribute("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"),
        user.getFirstAttribute("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname")
    );

    if (userLogin != null) {
      return userLogin;
    }

    Saml2Error authError = new Saml2Error("invalid_token", "User conversion fail");
    throw new Saml2AuthenticationException(authError);
  }

  public OidcUser oidcUserManagement(OAuth2AccessToken accessToken, ClientRegistration clientRegistration,
      OAuth2User user) {
    User loginUser = userOauth2Management(accessToken, clientRegistration, user);
    return new OpenExOidcUser() {
      @Override
      public String getId() {
        return loginUser.getId();
      }

      @Override
      public boolean isAdmin() {
        return loginUser.isAdmin();
      }

      @Override
      public Map<String, Object> getClaims() {
        return getAttributes();
      }

      @Override
      public OidcUserInfo getUserInfo() {
        return OidcUserInfo.builder().name(getName()).email(getEmail()).build();
      }

      @Override
      public OidcIdToken getIdToken() {
        return null;
      }

      @Override
      public Map<String, Object> getAttributes() {
        HashMap<String, Object> attributes = new HashMap<>();
        attributes.put("id", loginUser.getId());
        attributes.put("name", loginUser.getFirstname() + " " + loginUser.getLastname());
        attributes.put("email", loginUser.getEmail());
        return attributes;
      }

      @Override
      public Collection<? extends GrantedAuthority> getAuthorities() {
        List<SimpleGrantedAuthority> roles = new ArrayList<>();
        roles.add(new SimpleGrantedAuthority(ROLE_USER));
        if (loginUser.isAdmin()) {
          roles.add(new SimpleGrantedAuthority(ROLE_ADMIN));
        }
        return roles;
      }

      @Override
      public String getName() {
        return loginUser.getFirstname() + " " + loginUser.getLastname();
      }

    };
  }

  public OAuth2User oAuth2UserManagement(OAuth2AccessToken accessToken, ClientRegistration clientRegistration,
      OAuth2User user) {
    User loginUser = userOauth2Management(accessToken, clientRegistration, user);
    return new OpenExOAuth2User() {
      @Override
      public Map<String, Object> getAttributes() {
        HashMap<String, Object> attributes = new HashMap<>();
        attributes.put("id", loginUser.getId());
        attributes.put("name", loginUser.getFirstname() + " " + loginUser.getLastname());
        attributes.put("email", loginUser.getEmail());
        return attributes;
      }

      @Override
      public String getId() {
        return loginUser.getId();
      }

      @Override
      public Collection<? extends GrantedAuthority> getAuthorities() {
        List<SimpleGrantedAuthority> roles = new ArrayList<>();
        roles.add(new SimpleGrantedAuthority(ROLE_USER));
        if (loginUser.isAdmin()) {
          roles.add(new SimpleGrantedAuthority(ROLE_ADMIN));
        }
        return roles;
      }

      @Override
      public boolean isAdmin() {
        return false;
      }

      @Override
      public String getName() {
        return loginUser.getFirstname() + " " + loginUser.getLastname();
      }

    };
  }

  public Saml2Authentication saml2UserManagement(
      Saml2Authentication authentication) {
    Saml2AuthenticatedPrincipal user = (Saml2AuthenticatedPrincipal) authentication.getPrincipal();
    User loginUser = userSaml2Management(user);

    return new Saml2Authentication(new OpenExSaml2User() {
      @Override
      public String getName() {
        return loginUser.getName();
      }

      @Override
      public String getId() {
        return loginUser.getId();
      }

      @Override
      public Collection<? extends GrantedAuthority> getAuthorities() {
        List<SimpleGrantedAuthority> roles = new ArrayList<>();
        roles.add(new SimpleGrantedAuthority(ROLE_USER));
        if (loginUser.isAdmin()) {
          roles.add(new SimpleGrantedAuthority(ROLE_ADMIN));
        }
        return roles;
      }

      @Override
      public boolean isAdmin() {
        return loginUser.isAdmin();
      }
    }, authentication.getSaml2Response(), authentication.getAuthorities());
  }

  @Bean
  public OAuth2UserService<OidcUserRequest, OidcUser> oidcUserService() {
    OidcUserService delegate = new OidcUserService();
    return request -> oidcUserManagement(request.getAccessToken(), request.getClientRegistration(),
        delegate.loadUser(request));
  }

  @Bean
  public OAuth2UserService<OAuth2UserRequest, OAuth2User> oauth2UserService() {
    DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
    return request -> oAuth2UserManagement(request.getAccessToken(), request.getClientRegistration(),
        delegate.loadUser(request));
  }

  private OpenSaml4AuthenticationProvider getOpenSaml4AuthenticationProvider() {
    OpenSaml4AuthenticationProvider authenticationProvider = new OpenSaml4AuthenticationProvider();
    authenticationProvider.setResponseAuthenticationConverter(responseToken -> {
      Saml2Authentication authentication = OpenSaml4AuthenticationProvider
          .createDefaultResponseAuthenticationConverter()
          .convert(responseToken);
      assert authentication != null;
      return saml2UserManagement(authentication);
    });
    return authenticationProvider;
  }
}
