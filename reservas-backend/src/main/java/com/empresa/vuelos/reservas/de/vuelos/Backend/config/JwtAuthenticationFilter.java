package com.empresa.vuelos.reservas.de.vuelos.Backend.config;

import com.empresa.vuelos.reservas.de.vuelos.Backend.JwtService;
import com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Auth.Service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, CustomUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        System.out.println("➡️ Método: " + request.getMethod() + ", URI: " + request.getRequestURI());

        String requestId = UUID.randomUUID().toString();
        String path = request.getRequestURI();
        System.out.println("➡️ [" + requestId + "] Request a: " + path);

        // Rutas públicas que no requieren JWT
        List<String> publicPaths = List.of(
                "/api/auth/register",
                "/api/auth/login/token",
                "/api/vuelos",
                "/amadeus"   // sin slash final
        );


// Cualquier cosa que empiece con /amadeus es pública
        boolean isPublic = publicPaths.stream().anyMatch(path::startsWith);

        if (isPublic) {
            filterChain.doFilter(request, response);
            System.out.println("🟦 [" + requestId + "] Ruta pública, se omite validación JWT");
            return;
        }

        String header = request.getHeader("Authorization");
        System.out.println("🟦 [" + requestId + "] Authorization Header: " + header);

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            System.out.println("🟩 [" + requestId + "] Token recibido: " + token);

            try {
                String email = jwtService.getEmailFromToken(token);
                boolean isValid = jwtService.isTokenValid(token, email);

                if (isValid) {
                    UsernamePasswordAuthenticationToken authToken;
                    try {
                        // Camino principal: authorities desde BD
                        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                        authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                    } catch (Exception userLoadEx) {
                        // Fallback: no romper autenticación si falla carga de usuario
                        authToken = new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                        );
                        System.out.println("⚠️ [" + requestId + "] Fallback auth aplicado para email: " + email);
                        userLoadEx.printStackTrace();
                    }

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    System.out.println("✅ Autenticación seteada: " + SecurityContextHolder.getContext().getAuthentication());
                }
                else {
                    System.out.println("❌ [" + requestId + "] Token inválido");
                }
            } catch (Exception e) {
                System.out.println("❌ [" + requestId + "] Error procesando token:");
                e.printStackTrace();
            }
        } else {
            System.out.println("⚠️ [" + requestId + "] No se envió Authorization o no empieza con Bearer");
        }

        filterChain.doFilter(request, response);
        System.out.println("➡️ [" + requestId + "] FilterChain completado");
    }


}
