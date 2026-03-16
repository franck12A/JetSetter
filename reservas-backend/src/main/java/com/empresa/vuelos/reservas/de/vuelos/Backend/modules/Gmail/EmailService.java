package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Gmail;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String from = "enricifranco6@gmail.com";




    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /** MÉTODO PRINCIPAL — EMAIL ESTILO AIRBNB */
    public void sendWelcomeEmail(String to, String name, String userEmail) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject("Registro confirmado en JetSetter, " + name + "!");
            String year = String.valueOf(LocalDate.now().getYear());
            String loginUrl = "http://localhost:5173/login?fromEmail=true";
            String html = loadAirbnbTemplate(name, userEmail, year, loginUrl);

            helper.setText(html, true); // <-- CAMBIAR AQUÍ

            mailSender.send(msg);

        } catch (Exception e) {
            System.err.println("⚠ Error enviando email: " + e.getMessage());
        }
    }


    /** TEMPLATE HTML ESTILO AIRBNB */
    private String loadAirbnbTemplate(String name, String userEmail, String year, String loginUrl) {

        String html = """
                <!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8">
                  <title>Bienvenido</title>
                </head>
                <body style="margin:0; padding:0; background-color:#f7f7f7; font-family:Arial, sans-serif;">
                
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f7; padding:30px 0;">
                    <tr>
                      <td align="center">
                
                        <!-- CARD CENTRAL -->
                        <table width="600" cellpadding="0" cellspacing="0"
                               style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                
                          <!-- HEADER / LOGO -->
                          <tr>
                            <td style="padding:25px 40px; text-align:left;">
                              <img src="avionsito.png" alt="Vuelos" width="120" style="display:block;">
                            </td>
                          </tr>
                
                          <!-- HERO IMAGE -->
                          <tr>
                            <td>
                              <img src="logopaginapro.png"
                              alt="JetSetter"
                              width="120"
                              style="display:block; margin:0 auto; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.15);">
                
                            </td>
                          </tr>
                
                          <!-- TITLE -->
                          <tr>
  <td style="padding:30px 40px 10px 40px;">
    <h1 style="margin:0; font-size:26px; color:#333; font-weight:600;">
      Registro confirmado, {{NAME}}
    </h1>
  </td>
</tr>
                
                          <!-- TEXT -->
<tr>
  <td style="padding:10px 40px 8px 40px; color:#555; font-size:16px; line-height:24px;">
    Tu registro se completo con exito. Estos son los datos que ingresaste:
  </td>
</tr>
<tr>
  <td style="padding:0 40px 16px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee; border-radius:10px;">
      <tr>
        <td style="padding:10px 12px; font-size:14px; color:#555; width:140px; background:#fafafa;">
          Usuario
        </td>
        <td style="padding:10px 12px; font-size:14px; color:#333; font-weight:600;">
          {{NAME}}
        </td>
      </tr>
      <tr>
        <td style="padding:10px 12px; font-size:14px; color:#555; width:140px; background:#fafafa;">
          Email
        </td>
        <td style="padding:10px 12px; font-size:14px; color:#333; font-weight:600;">
          {{EMAIL}}
        </td>
      </tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:0 40px 20px 40px; color:#555; font-size:16px; line-height:24px;">
    Ya podes iniciar sesion con tu cuenta recien creada.
  </td>
</tr>

<!-- CTA BUTTON -->
                          <tr>
                            <td align="center" style="padding:20px 40px;">
                              <a href="{{LOGIN_URL}}"
                                 style="
                                    display:inline-block;
                                    background:#FF385C;
                                    color:#ffffff;
                                    padding:14px 30px;
                                    font-size:17px;
                                    font-weight:600;
                                    text-decoration:none;
                                    border-radius:10px;
                                    box-shadow:0 4px 14px rgba(255, 56, 92, 0.35);
                                    transition:all 0.25s ease;
                                    text-align:center;
                                 "
                                 onmouseover="this.style.background='#E03150'; this.style.boxShadow='0 6px 18px rgba(255, 56, 92, 0.45)'"
                                 onmouseout="this.style.background='#FF385C'; this.style.boxShadow='0 4px 14px rgba(255, 56, 92, 0.35)'"
                              >
                                Iniciar sesión
                              </a>
                
                            </td>
                          </tr>
                
                          <!-- FOOTER -->
                          <tr>
                            <td style="padding:25px 40px; font-size:13px; color:#888; background:#fafafa; border-top:1px solid #eee;">
                              Este es un email automático. No respondas a este mensaje.<br>
                              © {{YEAR}} Vuelos. Todos los derechos reservados.
                            </td>
                          </tr>
                
                        </table>
                
                      </td>
                    </tr>
                  </table>
                
                </body>
                </html>
                """;

        return html
                .replace("{{NAME}}", escape(name))
                .replace("{{EMAIL}}", escape(userEmail))
                .replace("{{LOGIN_URL}}", loginUrl)
                .replace("{{YEAR}}", year);
    }

    private String escape(String s) {
        return s == null ? "" : s.replace("<", "&lt;").replace(">", "&gt;");
    }

}




