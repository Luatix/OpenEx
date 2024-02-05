package io.openex.rest;

import io.openex.IntegrationTest;
import io.openex.database.repository.UserRepository;
import io.openex.rest.user.form.login.LoginUserInput;
import io.openex.rest.utils.fixtures.UserFixture;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static io.openex.rest.utils.JsonUtils.asJsonString;
import static org.junit.jupiter.api.TestInstance.Lifecycle.PER_CLASS;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestInstance(PER_CLASS)
class UserApiTest extends IntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private UserRepository userRepository;

    @AfterAll
    public void teardown() {
        this.userRepository.deleteAll();
    }

    @Nested
    @DisplayName("Logging in")
    class LoggingIn {
        @Nested
        @DisplayName("Logging in by email")
        class LoggingInByEmail {
            @Test
            void given_known_login_user_input_should_return_user() throws Exception {
                LoginUserInput loginUserInput = UserFixture.getLoginUserInput();

                mvc.perform(post("/api/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJsonString(loginUserInput)))
                        .andExpect(status().is2xxSuccessful())
                        .andExpect(jsonPath("login").value("email@test.io"));

            }
        }
    }
}
