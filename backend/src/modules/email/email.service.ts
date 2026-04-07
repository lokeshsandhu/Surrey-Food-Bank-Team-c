import FormData from "form-data"; // form-data v4.0.1
import Mailgun from "mailgun.js"; // mailgun.js v11.1.0
import { env } from "../../config/env";

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
    username: "api",
    key: env.MAILGUN_KEY,
});

// send booking confirmation email using "booking confirmation" template
export async function sendConfirmMessage(apptDate: string, apptTime: string, user: string, email: string) {
  try {
    const subjectUser = "Booking Confirmation for " + apptDate;
    const data = await mg.messages.create("sandbox566ace4bec16451b809897c40c8e522a.mailgun.org", {
      from: "Mailgun Sandbox <postmaster@sandbox566ace4bec16451b809897c40c8e522a.mailgun.org>",
      to: [email],
      subject: subjectUser,
      template: "booking confirmation",
      "h:X-Mailgun-Variables": JSON.stringify({
        bookingdate: apptDate,
        bookingtime: apptTime,
        username: user
      }),
    });

    return data;
  } catch (error) {
    return null;
  }
}

// send recovery email using "account recovery" template
export async function sendRecoveryMessage(email: string, link: string, username: string) {
  try {
    const subjectUser = "Account Recovery for " + username;
    const data = await mg.messages.create("sandbox566ace4bec16451b809897c40c8e522a.mailgun.org", {
      from: "Mailgun Sandbox <postmaster@sandbox566ace4bec16451b809897c40c8e522a.mailgun.org>",
      to: [email],
      subject: subjectUser,
      template: "account recovery",
      "h:X-Mailgun-Variables": JSON.stringify({
        username: username,
        recoverylink: link,
      }),
    });

    return data;
  } catch (error: any) {
    const message = error?.details || error?.message || "Unknown Mailgun error";
    throw new Error(`Recovery email failed: ${message}`);
  }
}

// send booking cancelled email using "cancellation confirmation" template
export async function sendCancelMessage(apptDate: string, apptTime: string, user: string, email: string) {
  try {
    const subjectUser = "Booking Cancelled for " + apptDate;
    const data = await mg.messages.create("sandbox566ace4bec16451b809897c40c8e522a.mailgun.org", {
      from: "Mailgun Sandbox <postmaster@sandbox566ace4bec16451b809897c40c8e522a.mailgun.org>",
      to: [email],
      subject: subjectUser,
      template: "cancellation confirmation",
      "h:X-Mailgun-Variables": JSON.stringify({
        bookingdate: apptDate,
        bookingtime: apptTime,
        username: user
      }),
    });

    return data;
  } catch (error) {
    return null;
  }
}

// send booking edited email using "edit confirmation" template
export async function sendEditMessage(originalApptDate: string, originalApptTime: string, apptDate: string, apptTime: string, user: string, email: string) {
  try {
    const subjectUser = "Booking Updated for " + apptDate;
    const data = await mg.messages.create("sandbox566ace4bec16451b809897c40c8e522a.mailgun.org", {
      from: "Mailgun Sandbox <postmaster@sandbox566ace4bec16451b809897c40c8e522a.mailgun.org>",
      to: [email],
      subject: subjectUser,
      template: "edit confirmation",
      "h:X-Mailgun-Variables": JSON.stringify({
        originalbookingdate: originalApptDate,
        originalbookingtime: originalApptTime,
        bookingdate: apptDate,
        bookingtime: apptTime,
        username: user
      }),
    });

    return data;
  } catch (error) {
    return null;
  }
}