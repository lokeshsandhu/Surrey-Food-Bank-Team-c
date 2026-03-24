import FormData from "form-data"; // form-data v4.0.1
import Mailgun from "mailgun.js"; // mailgun.js v11.1.0
import { env } from "../../config/env";

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
    username: "api",
    key: env.MAILGUN_KEY,
});

export async function sendConfirmMessage(date: string, time: string, user: string, email: string) {
  try {
    const subjectUser = "Booking Confirmation for " + user;
    const data = await mg.messages.create("sandbox566ace4bec16451b809897c40c8e522a.mailgun.org", {
      from: "Mailgun Sandbox <postmaster@sandbox566ace4bec16451b809897c40c8e522a.mailgun.org>",
      to: [email],
      subject: subjectUser,
      template: "booking confirmation",
      "h:X-Mailgun-Variables": JSON.stringify({
        bookingdate: date,
        bookingtime: time,
        username: user
      }),
    });

    return data;
  } catch (error) {
    return error;
  }
}

//sendConfirmMessage("Testing Date 123", "12:12", "Big Username Moment", "schoolpia914@gmail.com");

// const date = new Date("01/04/2026");

