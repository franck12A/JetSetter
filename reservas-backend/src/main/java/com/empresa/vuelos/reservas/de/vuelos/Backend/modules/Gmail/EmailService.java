package com.empresa.vuelos.reservas.de.vuelos.Backend.modules.Gmail;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String from = "enricifranco6@gmail.com";

    @Value("${app.provider.whatsapp:+54 11 5555-0101}")
    private String providerWhatsapp;

    @Value("${app.provider.email:soporte@jetsetter.com}")
    private String providerEmail;




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

    public void sendBookingConfirmationEmail(String to,
                                             String customerName,
                                             String productName,
                                             LocalDateTime bookingDate,
                                             LocalDate travelDate,
                                             LocalDate returnDate,
                                             String providerName,
                                             String flightNumber) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject("Reserva confirmada en JetSetter");
            helper.setText(buildBookingConfirmationTemplate(
                    to,
                    productName,
                    bookingDate,
                    travelDate,
                    returnDate,
                    providerName,
                    flightNumber
            ), true);
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("⚠ Error enviando email de reserva: " + e.getMessage());
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

    private String buildBookingConfirmationTemplate(String customerName,
                                                    String productName,
                                                    LocalDateTime bookingDate,
                                                    LocalDate travelDate,
                                                    LocalDate returnDate,
                                                    String providerName,
                                                    String flightNumber) {
        DateTimeFormatter bookingFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String travelDateLabel = travelDate != null ? travelDate.format(dateFormatter) : "No definida";
        String returnDateLabel = returnDate != null ? returnDate.format(dateFormatter) : "Sin regreso";
        String bookingDateLabel = bookingDate != null ? bookingDate.format(bookingFormatter) : "No definida";
        String providerLabel = providerName != null && !providerName.isBlank() ? providerName : "JetSetter";
        String flightLabel = flightNumber != null && !flightNumber.isBlank() ? flightNumber : "A confirmar";

        return """
                <!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8">
                  <title>Reserva confirmada</title>
                </head>
                <body style="margin:0; padding:0; background:#f5f7fb; font-family:Arial, sans-serif; color:#1f2937;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
                    <tr>
                      <td align="center">
                        <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(15,23,42,0.08);">
                          <tr>
                            <td style="padding:28px 36px; background:linear-gradient(135deg,#0f172a,#1d4ed8); color:#ffffff;">
                              <h1 style="margin:0; font-size:28px;">Reserva realizada con éxito</h1>
                              <p style="margin:10px 0 0; font-size:15px; opacity:0.9;">Hola {{CUSTOMER_NAME}}, ya confirmamos tu reserva.</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:28px 36px;">
                              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                                <tr>
                                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; color:#6b7280;">Producto</td>
                                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; text-align:right; font-weight:700;">{{PRODUCT_NAME}}</td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; color:#6b7280;">Fecha de reserva</td>
                                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; text-align:right; font-weight:700;">{{BOOKING_DATE}}</td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; color:#6b7280;">Salida</td>
                                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; text-align:right; font-weight:700;">{{TRAVEL_DATE}}</td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; color:#6b7280;">Regreso</td>
                                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; text-align:right; font-weight:700;">{{RETURN_DATE}}</td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; color:#6b7280;">Proveedor</td>
                                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; text-align:right; font-weight:700;">{{PROVIDER_NAME}}</td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; color:#6b7280;">Vuelo</td>
                                  <td style="padding:12px 0; border-bottom:1px solid #e5e7eb; text-align:right; font-weight:700;">{{FLIGHT_NUMBER}}</td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 0; color:#6b7280;">Contacto del proveedor</td>
                                  <td style="padding:12px 0; text-align:right; font-weight:700;">WhatsApp {{PROVIDER_WHATSAPP}} · {{PROVIDER_EMAIL}}</td>
                                </tr>
                              </table>
                              <p style="margin:22px 0 0; font-size:14px; line-height:1.6; color:#4b5563;">
                                Guarda este correo como comprobante. Si necesitas ayuda con cambios o consultas sobre tu viaje,
                                puedes comunicarte con el proveedor usando los datos indicados arriba.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """
                .replace("{{CUSTOMER_NAME}}", escape(customerName))
                .replace("{{PRODUCT_NAME}}", escape(productName))
                .replace("{{BOOKING_DATE}}", escape(bookingDateLabel))
                .replace("{{TRAVEL_DATE}}", escape(travelDateLabel))
                .replace("{{RETURN_DATE}}", escape(returnDateLabel))
                .replace("{{PROVIDER_NAME}}", escape(providerLabel))
                .replace("{{FLIGHT_NUMBER}}", escape(flightLabel))
                .replace("{{PROVIDER_WHATSAPP}}", escape(providerWhatsapp))
                .replace("{{PROVIDER_EMAIL}}", escape(providerEmail));
    }

}




