package com.govguide.persistence;

import java.util.List;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

public interface GovGuideUserManager extends UserDetailsService {
    void createUser(UserDetails user);
    boolean userExists(String username);
    long getUserCount();
    List<String> getAllUsernames();
}
