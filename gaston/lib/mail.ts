import nodemailer from "nodemailer";

/**
 * Configure le transporteur d'emails via le protocole SMTP.
 * En production, utilisez des variables d'environnement pour ces valeurs.
 *
 * Variables d'environnement attendues :
 * - SMTP_HOST  : adresse du serveur SMTP (ex: smtp.gmail.com)
 * - SMTP_PORT  : port du serveur SMTP (ex: 587 pour TLS, 465 pour SSL)
 * - SMTP_SECURE: "true" si connexion sécurisée SSL (port 465), sinon false
 * - SMTP_USER  : adresse email de l'expéditeur
 * - SMTP_PASS  : mot de passe ou mot de passe d'application SMTP
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Envoie un email de vérification avec le code donné.
 *
 * @param email - Adresse email du destinataire
 * @param code  - Code de vérification à 6 chiffres (ou autre format) généré lors de l'inscription
 * @returns Un objet { success: true } en cas de succès, ou { success: false, error } en cas d'échec
 */
export async function sendVerificationEmail(email: string, code: string) {
    // Définition du contenu de l'email : expéditeur, destinataire, sujet et corps HTML
    const mailOptions = {
        from: `"Gaston Platform" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Votre code de vérification Gaston Platform",
        // Corps HTML de l'email avec mise en forme visuelle du code de vérification
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #bca086; text-align: center;">Vérification de votre compte</h2>
                <p>Bonjour,</p>
                <p>Merci de vous être inscrit sur <strong>Gaston Platform</strong>. Pour finaliser votre inscription, veuillez utiliser le code de vérification suivant :</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1a1a1a; background: #f9f9f9; padding: 10px 20px; border-radius: 5px; border: 1px dashed #bca086;">${code}</span>
                </div>
                <p>Ce code est valable pendant 10 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2026 Gaston Platform. Tous droits réservés.</p>
            </div>
        `,
    };

    try {
        // Tentative d'envoi de l'email via le transporteur SMTP configuré
        await transporter.sendMail(mailOptions);
        console.log(`Email de vérification envoyé à ${email}`);
        return { success: true };
    } catch (error) {
        // En cas d'échec (serveur SMTP inaccessible, identifiants incorrects, etc.)
        console.error("Erreur lors de l'envoi de l'email de vérification:", error);
        return { success: false, error };
    }
}
