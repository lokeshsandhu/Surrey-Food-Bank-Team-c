import FormData from "form-data"; // form-data v4.0.1
import Mailgun from "mailgun.js"; // mailgun.js v11.1.0

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
    username: "api",
    key: "",
});

export async function sendConfirmMessage(date, user) {
  try {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const subjectUser = "Booking Confirmation for " + user;
    const formattedDate = date.toLocaleString("en-US", options);

    console.log("sending an email now with ", formattedDate, date, user);


    const data = await mg.messages.create("sandbox566ace4bec16451b809897c40c8e522a.mailgun.org", {
      from: "Mailgun Sandbox <postmaster@sandbox566ace4bec16451b809897c40c8e522a.mailgun.org>",
      to: ["Pia Yee <schoolpia914@gmail.com>"],
      subject: subjectUser,
      template: "booking confirmation",
      "h:X-Mailgun-Variables": JSON.stringify({
        bookingdate: formattedDate,
        username: user
      }),
    });

    console.log(data); // logs response data
  } catch (error) {
    console.log(error); //logs any error
  }
}

// const date = new Date("01/04/2026");
// var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
// console.log(date, date.toLocaleString("en-US", options));
// sendConfirmMessage(date, "test username");
