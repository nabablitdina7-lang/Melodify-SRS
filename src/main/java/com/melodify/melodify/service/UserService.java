package com.melodify.melodify.service;

import com.melodify.melodify.model.User;
import com.melodify.melodify.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

public User registerUser(User user) {

    System.out.println("EMAIL: " + user.getEmail());
    System.out.println("PASSWORD: " + user.getPassword());

    if (user.getPassword() == null || user.getEmail() == null) {
        throw new RuntimeException("Email or password is missing");
    }

    user.setPassword(passwordEncoder.encode(user.getPassword()));

    return userRepository.save(user);
}

    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

public User login(String email, String password) {
    User user = userRepository.findByEmail(email);
    if (user == null) {
        throw new RuntimeException("User not found");
    }
    if (!passwordEncoder.matches(password, user.getPassword())) {
        throw new RuntimeException("Wrong password");
    }
    return user;
}
}