package com.govguide.persistence;

import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

@Component
@Profile("db")
public class JdbcUserManager implements GovGuideUserManager {
    private final JdbcTemplate jdbc;

    public JdbcUserManager(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        List<UserDetails> users = jdbc.query(
                "SELECT username, encoded_password, role, enabled FROM app_user WHERE username = ?",
                (rs, row) -> User.withUsername(rs.getString("username"))
                        .password(rs.getString("encoded_password"))
                        .roles(rs.getString("role"))
                        .disabled(!rs.getBoolean("enabled"))
                        .build(),
                username);
        if (users.isEmpty()) throw new UsernameNotFoundException("User not found: " + username);
        return users.get(0);
    }

    @Override
    public void createUser(UserDetails user) {
        String role = user.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .findFirst().orElse("USER");
        jdbc.update("INSERT INTO app_user (username, encoded_password, role, enabled) VALUES (?, ?, ?, ?)",
                user.getUsername(), user.getPassword(), role, user.isEnabled());
    }

    @Override
    public boolean userExists(String username) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM app_user WHERE username = ?", Integer.class, username);
        return count != null && count > 0;
    }

    @Override
    public long getUserCount() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM app_user", Long.class);
        return c != null ? c : 0;
    }

    @Override
    public List<String> getAllUsernames() {
        return jdbc.queryForList("SELECT username FROM app_user ORDER BY created_at", String.class);
    }
}
