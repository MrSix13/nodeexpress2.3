import cors from 'cors';
const { Client, LocalAuth, RemoteAuth,MessageMedia } = pkg;
import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
import express from 'express';
import {mongoose} from 'mongoose';
import { MongoStore } from 'wwebjs-mongo';
import morgan from 'morgan';


const app = express();


dotenv.config();
app.use(express.json())
app.use(morgan('dev'));

app.use(cors());




let client                   = null;
let isWhatsAppConnection     = false;
let otherPeticiones          = false;
let versionCacheWhastAppWeb  = '2.2413.51-beta.html'

const port       = process.env.PORT || 4000;
//=======================MONGODB=========================//
const MONGO_URI  = process.env.MONGODB_URI;



async function connectWhastApp(){
    await mongoose.connect(MONGO_URI)
    const store = new MongoStore({mongoose: mongoose});

    if(!isWhatsAppConnection){
        console.log('Creando Instancia Client')
        client = new Client({
          authStrategy: new MongoRemoteAuth({
              store: store,
              backupSyncIntervalMs: 300000
          }),
          webVersionCache: {
                  type: "remote",
                  remotePath:
                    `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${versionCacheWhastAppWeb}`,
                },
        });
        client.on('qr', (qr) => {
            qrcode.generate(qr, { small: true });
            console.log('QR RECEIVED', qr);
        });
        
        client.once('ready', async() => {
            console.log('Conectado a WhatsApp');
            isWhatsAppConnection = true;

        })
        
        await client.initialize();

        // console.log('client antes:', client)
        
        // console.log('Sesión cloeint:', client.getSession());
        
        // isWhatsAppConnection = await new Promise((resolve) => {
        //         client.on('ready', () => {
        //               console.log('Conectado a WhatsApp');
        //               resolve(true);
        //             });
        //         });
        // isWhatsAppConnection = await new Promise((resolve) => client.once('ready', resolve));
        // console.log('Finalizando Instancia Client')  
                
      }
}



async function conectDB(){
  try {
    await connectWhastApp()
    console.log('Conectandose a Whastap Web')
   
    if(isWhatsAppConnection){
        console.log('client despues:', client)
    }
    
    console.log('Coneccion corecta')
    
    } catch (error) {
      console.log(error)
      throw error
    }

};

const SessionSchema = new mongoose.Schema({
  id        : {type: String, unique:true},
  session   : {type: Buffer},
  qrCode    : {type: Buffer},
  expiresAt : {type: Date}
});

const Session = mongoose.model('Session',SessionSchema);


class MongoRemoteAuth extends RemoteAuth{
  constructor(store){
    super(store);
  }

  async getSession() {
    try {
      const sessions = await Session.find();
      return sessions.map((session) => ({
        id: session.id,
        session: session.session,
        qrCode: session.qrCode,
        expiresAt: session.expiresAt,
      }));
    } catch (error) {
      console.error('Error al recuperar sesiones:', error);
      // Puede lanzar un error personalizado o manejarlo de manera diferente
    }
  }


  async saveSession(session){
    if (!session.id || !session.session) {
        throw new Error('Datos de sesión no válidos. Faltan propiedades requeridas.');
    }
    const existingSession = await Session.findById(session.id);
    if(existingSession){
      await existingSession.updateOne(session);
    }else{
      const now = new Date();
      const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      session.expiresAt = oneMonthFromNow 
      const newSession = new Session(session);
      console.log('Nueva Sesion:', newSession)
      await newSession.save();
    }
  }


  async deleteSession(sessionId){
    await Session.findByIdAndDelete(sessionId)
  }

  async checkAndDeleteExpiredSessions() {
    const now = new Date();
    const expiredSessions = await Session.find({ expiresAt: { $lt: now } });
  
    for (const session of expiredSessions) {
      await session.delete();
    }
  }
}

//=======================MONGODB=========================//




// const client = new Client({
//     authStrategy: new LocalAuth({ dataPath: 'session' }),
//     webVersionCache: {
//       type: "remote",
//       remotePath:
//         "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
//     },
//   });



app.get('/status', (req,res)=>{
    return res.json({
      isWhatsAppConnection
    })
})

app.get('/conection', async(req,res)=>{
    try {
      await conectDB()
    } catch (error) {
      console.log(error)
      return res.json({error: 'Error al conectar WhatsApp'})
    }  
  
  
  return res.json({isWhatsAppConnection})
})


app.post('/enviar-mensaje', async(req,res)=>{
  try {
  if (!client) {
      await conectDB();
  }

  if(!isWhatsAppConnection){
    await conectDB();
  }
    if(isWhatsAppConnection){
      const {numero, mensaje} = req.body;   
      for (const phoneNumber of numero) {
          const formattedNumber = phoneNumber + '@c.us';
          console.log('formattedNumber:', formattedNumber)
          await client.sendMessage(formattedNumber, mensaje || 'test');

      }   
     res.json({ mensaje: 'Mensajes enviados correctamente.' });
    }
 } catch (error) {
  console.error('Error sending message:', error);
  conectDB()
  res.status(500).json({ mensaje: 'Error al enviar mensajes' });
  }
  
});


app.post('/enviar-mensaje-pdf', async(req,res)=>{
  try {
  if (!client) {
      await conectDB();
  }

  if(!isWhatsAppConnection){
    await conectDB();
  }
    if(isWhatsAppConnection){
      const {numero} = req.body;   
      for (const phoneNumber of numero) {
          const formattedNumber = phoneNumber + '@c.us';
          console.log('formattedNumber:', formattedNumber)
          const media = await MessageMedia.fromUrl('https://www.mtoopticos.cl/pdf/junaeb.pdf');
          await client.sendMessage(formattedNumber, media,  { caption: 'this is my caption' });

      }   
     res.json({ mensaje: 'Mensajes enviados correctamente.' });
    }
 } catch (error) {
  console.error('Error sending message:', error);
  conectDB()
  res.status(500).json({ mensaje: 'Error al enviar mensajes' });
  }
  
});





app.listen(port, async ()=>{
    console.log('app escuchando en puerto' + port)
})

