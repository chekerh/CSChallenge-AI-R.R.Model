import { Resend } from 'resend';
import { getResendApiKey } from '../config/env';

const resend = new Resend(getResendApiKey());
const FROM_EMAIL = process.env.FROM_EMAIL || 'UtopiaHire <onboarding@resend.dev>';

export async function sendPasswordResetEmail(email: string, resetToken: string, userId: string) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Réinitialisation de votre mot de passe - UtopiaHire',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Réinitialisation du mot de passe</h2>
          <p>Bonjour,</p>
          <p>Vous avez demandé à réinitialiser votre mot de passe pour UtopiaHire.</p>
          <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
            Réinitialiser mon mot de passe
          </a>
          <p style="color: #6b7280; font-size: 14px;">
            Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            © 2025 UtopiaHire. Tous droits réservés.
          </p>
        </div>
      `,
    });
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send reset email');
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Bienvenue sur UtopiaHire ! 🚀',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Bienvenue ${name || ''}!</h2>
          <p>Félicitations et bienvenue sur UtopiaHire, votre assistant IA pour la recherche d'emploi.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Voici ce que vous pouvez faire :</h3>
            <ul style="line-height: 1.8;">
              <li>✅ Créer un CV professionnel avec notre éditeur IA</li>
              <li>✅ Analyser et optimiser votre CV existant</li>
              <li>✅ Automatiser la recherche d'emplois avec nos agents intelligents</li>
              <li>✅ Suivre toutes vos candidatures en un seul endroit</li>
            </ul>
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
            Commencer maintenant
          </a>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            © 2025 UtopiaHire. Tous droits réservés.
          </p>
        </div>
      `,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

export async function sendInvoiceEmail(email: string, amount: number, currency: string, invoiceUrl: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Facture - UtopiaHire Pro`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Votre facture</h2>
          <p>Bonjour,</p>
          <p>Votre paiement pour UtopiaHire Pro a été traité avec succès.</p>
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
            <p style="font-size: 18px; font-weight: bold; color: #16a34a;">
              Montant: ${amount} ${currency.toUpperCase()}
            </p>
            <p style="color: #6b7280; font-size: 14px;">Statut: Payé</p>
          </div>
          <a href="${invoiceUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
            Télécharger la facture
          </a>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            © 2025 UtopiaHire. Tous droits réservés.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send invoice email:', error);
  }
}