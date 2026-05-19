/**
 * Envoie un SMS de vérification via l'API transactionnelle Brevo (anciennement Sendinblue).
 *
 * Variables d'environnement attendues :
 * - BREVO_API_KEY    : clé API Brevo pour authentifier les requêtes
 * - BREVO_SMS_SENDER : nom de l'expéditeur affiché sur le SMS (max 11 caractères alphanumériques)
 *
 * @param phone - Numéro de téléphone du destinataire au format international (ex: +21655123456)
 * @param code  - Code de vérification à transmettre par SMS
 * @returns Un objet { success: true } en cas de succès, ou { success: false, error } en cas d'échec
 */
export async function sendVerificationSMS(phone: string, code: string) {
    // Récupération de la clé API Brevo depuis les variables d'environnement
    const apiKey = process.env.BREVO_API_KEY;
    // Nom de l'expéditeur affiché sur le SMS, "Gaston" par défaut si non défini
    const sender = process.env.BREVO_SMS_SENDER || "Gaston";

    // Vérification de la présence de la clé API avant toute tentative d'envoi
    if (!apiKey) {
        console.error("BREVO_API_KEY manquant dans .env");
        return { success: false, error: "Configuration SMS manquante." };
    }

    // Construction du corps de la requête envoyée à l'API Brevo
    const body = {
        sender,                  // Nom affiché comme expéditeur du SMS
        recipient: phone,        // Numéro de téléphone du destinataire
        content: `Gaston Platform - Votre code de vérification : ${code}. Valable 10 minutes.`,
    };

    try {
        // Appel HTTP POST vers l'endpoint SMS transactionnel de l'API Brevo
        const response = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
            method: "POST",
            headers: {
                "api-key": apiKey,           // Authentification via la clé API dans l'en-tête
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        // Lecture et parsing de la réponse JSON retournée par l'API
        const data = await response.json();

        // Si le statut HTTP n'est pas 2xx, l'envoi a échoué côté Brevo
        if (!response.ok) {
            console.error("❌ Brevo SMS erreur:", JSON.stringify(data, null, 2));
            return { success: false, error: `Brevo: ${data?.message || data?.code || "Erreur inconnue"}` };
        }

        // Succès : le SMS a bien été accepté par l'API Brevo pour envoi
        console.log(`✅ SMS envoyé à ${phone}:`, JSON.stringify(data, null, 2));
        return { success: true };
    } catch (error) {
        // Erreur réseau (pas de connexion internet, timeout, DNS, etc.)
        console.error("❌ Erreur réseau SMS:", error);
        return { success: false, error: "Erreur réseau lors de l'envoi du SMS." };
    }
}
