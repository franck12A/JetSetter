package com.empresa.vuelos.reservas.de.vuelos.Backend.config;

import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Service.CustomUserDetailsService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.config.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/login/token",
            "/api/auth/register",
            "/amadeus",
            "/amadeus/",
            "/amadeus/buscar",
            "/api/products",
            "/api/products/",
            "/api/categories",
            "/api/categories/"
    );


    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        System.out.println("🔐 Inicializando SecurityFilterChain...");

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration config = new CorsConfiguration();
                    config.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
                    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    config.setAllowedHeaders(List.of("*"));
                    config.setExposedHeaders(List.of("*"));
                    config.setAllowCredentials(true);
                    System.out.println("🌐 Configuración CORS aplicada para request: " + request.getRequestURI());
                    return config;
                }))
                .authorizeHttpRequests(auth -> {
                    System.out.println("🛡 Configurando rutas públicas y privadas...");
                    auth
                            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                            .requestMatchers("/api/auth/register", "/api/auth/login/token").permitAll()
                            .requestMatchers(HttpMethod.GET, "/api/auth/all").permitAll()
                            .requestMatchers(HttpMethod.DELETE, "/api/auth/**").permitAll()
                            .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                            .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                            .requestMatchers(HttpMethod.GET, "/api/images/**").permitAll()
                            .requestMatchers(HttpMethod.POST, "/api/products/**").hasAuthority("ROLE_ADMIN")
                            .requestMatchers(HttpMethod.PUT, "/api/products/**").hasAuthority("ROLE_ADMIN")
                            .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasAuthority("ROLE_ADMIN")
                            .requestMatchers("/api/favorites/**").authenticated()

                            .requestMatchers("/api/bookings/**").hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")
                            .requestMatchers("/vuelos/**", "/api/vuelos/**").permitAll()
                            .requestMatchers("/amadeus/vuelos/**").permitAll()
                            .requestMatchers("/amadeus/**").permitAll()
                            .requestMatchers("/imagenes/**").permitAll()
                            .requestMatchers("/amadeus/buscar").permitAll()
                            .anyRequest().authenticated();
                })
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        System.out.println("✅ SecurityFilterChain cargada correctamente");
        return http.build();
    }


    @Bean
    public AuthenticationManager authManager(HttpSecurity http, CustomUserDetailsService uds) throws Exception {
        AuthenticationManagerBuilder authBuilder =
                http.getSharedObject(AuthenticationManagerBuilder.class);

        authBuilder
                .userDetailsService(uds)
                .passwordEncoder(passwordEncoder());

        return authBuilder.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
