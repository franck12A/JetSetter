package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Repository;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Model.User; // <-- ojo con Model y Auth
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
