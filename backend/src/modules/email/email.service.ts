import FormData from "form-data"; // form-data v4.0.1
import Mailgun from "mailgun.js"; // mailgun.js v11.1.0
import { env } from "../../config/env";

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
    username: "api",
    key: env.MAILGUN_KEY,
});

export async function sendConfirmMessage(apptdate: string, appttime: string, user: string, email: string) {
  try {
    const subjectUser = "Booking Confirmation for " + apptdate;
    const data = await mg.messages.create("sandbox566ace4bec16451b809897c40c8e522a.mailgun.org", {
      from: "Mailgun Sandbox <postmaster@sandbox566ace4bec16451b809897c40c8e522a.mailgun.org>",
      to: [email],
      subject: subjectUser,
      template: "booking confirmation",
      "h:X-Mailgun-Variables": JSON.stringify({
        bookingdate: apptdate,
        bookingtime: appttime,
        username: user
      }),
    });

    return data;
  } catch (error) {
    return error;
  }
}

// send recovery email using "account recovery" template
export async function sendRecoveryMessage(email: string, link: string) {
  try {
    const subjectUser = "Account Recovery for " + email;
    const data = await mg.messages.create("sandbox566ace4bec16451b809897c40c8e522a.mailgun.org", {
      from: "Mailgun Sandbox <postmaster@sandbox566ace4bec16451b809897c40c8e522a.mailgun.org>",
      to: [email],
      subject: subjectUser,
      template: "account recovery",
      "h:X-Mailgun-Variables": JSON.stringify({
        useremail: email,
        recoverylink: link,
      }),
    });

    return data;
  } catch (error) {
    return error;
  }
}