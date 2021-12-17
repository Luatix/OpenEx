package io.openex.rest.security;

import io.openex.config.OpenExConfig;
import io.openex.database.model.User;
import io.openex.database.repository.UserRepository;
import io.openex.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.Optional;

import static java.util.Optional.ofNullable;
import static org.springframework.util.StringUtils.hasLength;

@EnableWebSecurity
public class AppSecurityConfig extends WebSecurityConfigurerAdapter {

    private UserRepository userRepository;
    private UserService userService;
    private OpenExConfig openExConfig;

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

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.addFilterBefore(tokenAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
                .csrf()
                /**/.disable()
                .formLogin()
                /**/.disable()
                .logout()
                /**/.disable()
                .authorizeRequests()
                /**/.antMatchers("/api/parameters").permitAll()
                /**/.antMatchers("/api/comcheck").permitAll()
                /**/.antMatchers("/api/login").permitAll()
                /**/.antMatchers("/api/**").authenticated()
                .and()
                .logout()
                /**/.logoutSuccessUrl("/");

        if (openExConfig.isAuthOpenidEnable()) {
            http.oauth2Login();
        }

        // Rewrite 403 code to 401
        http.exceptionHandling().authenticationEntryPoint((request, response, authException)
                -> response.setStatus(HttpStatus.UNAUTHORIZED.value()));
    }

    @Bean
    public TokenAuthenticationFilter tokenAuthenticationFilter() {
        return new TokenAuthenticationFilter();
    }

    @Bean
    public OAuth2UserService<OAuth2UserRequest, OAuth2User> oauth2UserService() {
        DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
        return request -> {
            OAuth2User user = delegate.loadUser(request);
            String emailAttribute = user.getAttribute("email");
            String email = ofNullable(emailAttribute).orElseThrow();
            if (hasLength(email)) {
                String name = user.getAttribute("name");
                String firstName = user.getAttribute("given_name");
                String lastName = user.getAttribute("family_name");
                Optional<User> optionalUser = userRepository.findByEmail(email);
                return optionalUser.orElseGet(() ->
                        userService.createUser(email, name, firstName, lastName));
            }
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("invalid_token", "User conversion fail", "")
            );
        };
    }
}