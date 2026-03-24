package com.empresa.vuelos.reservas.de.vuelos.Backend;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.*;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKeyString;

    private static final long TOKEN_TTL_MS = 1000L * 60 * 60 * 24 * 7; // 7 dias

    private Key key;

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(secretKeyString.getBytes());
        System.out.println("🔑 JwtService inicializado, clave lista para firmar/verificar tokens");
    }


    public String generateToken(String email, String role) {
        String cleanRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        String token = Jwts.builder()
                .setSubject(email)
                .claim("roles", List.of(cleanRole))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + TOKEN_TTL_MS))
                .signWith(key)
                .compact();

        System.out.println("🟢 Token generado para " + email + " con rol " + cleanRole + " → " + token);
        return token;
    }




    public Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String getEmailFromToken(String token) {
        String email = getClaims(token).getSubject();
        System.out.println("🟩 Email extraído del token: " + email);
        return email;
    }

    public List<String> getRoles(String token) {
        List<String> roles = getClaims(token).get("roles", List.class);
        System.out.println("🟩 Roles extraídos del token: " + roles);
        return roles;
    }



    public boolean isTokenValid(String token, String email) {
        try {
            boolean ok = getEmailFromToken(token).equals(email)
                    && getClaims(token).getExpiration().after(new Date());
            System.out.println("🟦 Token válido para " + email + "? " + ok);
            return ok;
        } catch (Exception e) {
            System.out.println("❌ Error validando token:");
            e.printStackTrace();
            return false;
        }
    }


}
