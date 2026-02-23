package com.empresa.vuelos.reservas.de.vuelos.Backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;

@Component
public class ImageCleanupRunner implements CommandLineRunner {

    private static final String UPLOAD_DIR = "src/main/resources/static/images/";

    @Override
    public void run(String... args) throws Exception {
        Path dir = Paths.get(UPLOAD_DIR);
        if (Files.exists(dir)) {
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
                for (Path file : stream) {
                    Files.deleteIfExists(file);
                }
            } catch (IOException e) {
                System.err.println("Error borrando imágenes: " + e.getMessage());
            }
        }
        System.out.println("Carpeta de imágenes limpia al iniciar el backend.");
    }
}
