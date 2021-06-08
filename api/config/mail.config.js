const nodemailer = require('nodemailer');

const mail = {
    user: 'samva2328@gmail.com', //correo que envia los mensajes
    pass: 'samvaisreal' //contraseña del correo
}

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", //host de gmail
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: mail.user, // generated ethereal user
      pass: mail.pass, // generated ethereal password
    },
  });

  const sendEmail = async (email, subject, html) => {
    try {
        
        await transporter.sendMail({
            from: `samva2328@gmail.com`, // correo del emisor
            to: email, // receptor
            subject: 'WTS - un nuevo título cada día', // asunto del correo
            text: "WTS, un nuevo título cada día", // cuerpo del correo
            html, // html body
        });
        console.log('El correo se envió con exito.');
    } catch (error) {
        console.log('El correo no pudo enviarse.', error);
    }
  }

  const getTemplate = (name, token) => {
      return `
        <head>
            <link rel="stylesheet" href="./style.css">
        </head>
        
        <div id="email___content">
            <img src="https://imgur.com/0eIng0q" alt="">
            <h2>Hola ${ name }</h2>
            <p>¡Bienvenid@ a WTS! Gracias por registrarte.</p>
            <a
                href="http://localhost:4200/"
                target="_blank"
            >Accede a tu cuenta desde aquí.</a>
        </div>
      `;
  }
  //href="http://localhost:3800/api/user/confirm/${ token }"

  module.exports = {
    sendEmail,
    getTemplate
  }