import nodemailer from "nodemailer";

type MailResult = { success: true } | { success: false; error: string };
type Sender = { name: string; email: string };

function getRequiredEnv(name: string) {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Variable d'environnement manquante: ${name}`);
    }
    return value;
}

function getMailErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "Erreur SMTP inconnue.";
}

function getSender(defaultEmail?: string): Sender {
    const from = process.env.SMTP_FROM?.trim();
    const match = from?.match(/^(?:"?([^"<]+)"?\s*)?<([^<>@\s]+@[^<>@\s]+)>$/);

    if (match) {
        return {
            name: match[1]?.trim() || "Gaston Platform",
            email: match[2].trim(),
        };
    }

    if (from && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(from)) {
        return { name: "Gaston Platform", email: from };
    }

    if (!defaultEmail) {
        throw new Error("Variable d'environnement manquante: SMTP_FROM ou SMTP_USER");
    }

    return { name: "Gaston Platform", email: defaultEmail };
}

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
function createTransporter() {
    const port = Number(process.env.SMTP_PORT || "587");
    const timeout = Number(process.env.SMTP_TIMEOUT || "10000");

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port,
        secure: process.env.SMTP_SECURE === "true" || port === 465,
        requireTLS: port === 587,
        connectionTimeout: timeout,
        greetingTimeout: timeout,
        socketTimeout: timeout,
        auth: {
            user: getRequiredEnv("SMTP_USER"),
            pass: getRequiredEnv("SMTP_PASS"),
        },
    });
}

async function sendWithBrevoApi(email: string, subject: string, html: string, sender: Sender): Promise<MailResult> {
    const apiKey = process.env.BREVO_API_KEY?.trim();

    if (!apiKey) {
        return { success: false, error: "BREVO_API_KEY manquant." };
    }

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": apiKey,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                sender,
                to: [{ email }],
                subject,
                htmlContent: html,
            }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const message = data?.message || data?.code || `HTTP ${response.status}`;
            console.error("Erreur Brevo lors de l'envoi de l'email:", data || message);
            return { success: false, error: `Brevo: ${message}` };
        }

        console.log(`Email de vérification envoyé à ${email} via Brevo API`);
        return { success: true };
    } catch (error) {
        const message = getMailErrorMessage(error);
        console.error("Erreur réseau Brevo lors de l'envoi de l'email:", message);
        return { success: false, error: message };
    }
}

/**
 * Envoie un email de vérification avec le code donné.
 *
 * @param email - Adresse email du destinataire
 * @param code  - Code de vérification à 6 chiffres (ou autre format) généré lors de l'inscription
 * @returns Un objet { success: true } en cas de succès, ou { success: false, error } en cas d'échec
 */
export async function sendVerificationEmail(email: string, code: string): Promise<MailResult> {
    const smtpUser = process.env.SMTP_USER?.trim();
    let sender: Sender;
    const subject = "Votre code de vérification Gaston Platform";
    const html = `
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
    `;

    try {
        sender = getSender(smtpUser);
    } catch (error) {
        const message = getMailErrorMessage(error);
        console.error("Configuration email invalide:", message);
        return { success: false, error: message };
    }

    if (process.env.BREVO_API_KEY?.trim()) {
        return sendWithBrevoApi(email, subject, html, sender);
    }

    let transporter: nodemailer.Transporter;

    try {
        getRequiredEnv("SMTP_USER");
        transporter = createTransporter();
    } catch (error) {
        const message = getMailErrorMessage(error);
        console.error("Configuration SMTP invalide:", message);
        return { success: false, error: message };
    }

    // Définition du contenu de l'email : expéditeur, destinataire, sujet et corps HTML
    const mailOptions = {
        from: process.env.SMTP_FROM || `"${sender.name}" <${sender.email}>`,
        to: email,
        subject,
        // Corps HTML de l'email avec mise en forme visuelle du code de vérification
        html,
    };

    try {
        // Tentative d'envoi de l'email via le transporteur SMTP configuré
        await transporter.sendMail(mailOptions);
        console.log(`Email de vérification envoyé à ${email}`);
        return { success: true };
    } catch (error) {
        // En cas d'échec (serveur SMTP inaccessible, identifiants incorrects, etc.)
        const message = getMailErrorMessage(error);
        console.error("Erreur lors de l'envoi de l'email de vérification:", message);
        return { success: false, error: message };
    }
}
