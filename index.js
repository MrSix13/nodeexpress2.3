import express from 'express';
// import { Client, LocalAuth } from 'whatsapp-web.js';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import cors from 'cors';


const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(cors());

let client = null

// async function reconnect() {
//     try {
//       await client.initialize();
//       console.log('Reconnected to WhatsApp Web!');
//     } catch (error) {
//       console.error('Error during reconnection:', error);
//       // Implement exponential backoff or retry logic here
//     }
//   }



  

app.get('/', (req,res)=>{
    return res.json({mensaje: "hola mundo"})
})

app.post('/enviar-mensaje', async(req,res)=>{
    const {numero, mensaje} = req.body;   

    if (!client) {
        client = new Client({
            authStrategy: new LocalAuth({ dataPath: 'session' }),
            webVersionCache: {
                type: "remote",
                remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
            },
        });

        // Eventos del cliente
        client.on('qr', (qr) => {
            qrcode.generate(qr, { small: true });
            console.log('QR RECEIVED', qr);
        });

        client.on('ready', () => {
            console.log('Conectado a WhatsApp');
        });

        // Inicialización del cliente
        await client.initialize();
    }

    // const client =  new Client({
    //     authStrategy: new LocalAuth({ dataPath: 'session' }),
    //     webVersionCache: {
    //     type: "remote",
    //     remotePath:
    //         "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    //     },
    // });

    
        // client.on('qr', (qr)=>{
        //     qrcode.generate(qr, {small:true})
        //     console.log('QR RECEIVED', qr)
        // });

        // client.on('remote_session_saved', () => {
        //     console.log('remote_session_saved')
        // });
        // client.on('ready', ()=>{
        //     console.log('Conectado a wsp');
        // });
        // client.on('message', (message)=>{
        // });


    // await client.initialize();  
    
    
   
   try {
        for (const phoneNumber of numero) {
            const formattedNumber = phoneNumber + '@c.us';
            console.log('formattedNumber:', formattedNumber)
            await client.sendMessage(formattedNumber, mensaje);
        }   
       res.json({ mensaje: 'Mensajes enviados correctamente.' });
   } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ mensaje: 'Error al enviar mensajes' });
    }
    
});

app.listen(port, ()=>{
    console.log(`servidor escuchando en el puerto ${port}`)
});
