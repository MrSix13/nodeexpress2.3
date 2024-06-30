import express from 'express'
import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
const router = express.Router();

let client                   = null;
let isWhatsAppConnection     = false;



router.get('/', (req,res)=>{
    return res.json({
       mensaje:"Bienvenido a API node"
    })
})

router.get('/status', (req,res)=>{
    return res.json({
      isWhatsAppConnection
    })
})

router.get('/conection', async(req,res)=>{
    try {
      await conectDB()
    } catch (error) {
      console.log(error)
      return res.json({error: 'Error al conectar WhatsApp'})
    }  
  
    
  
  return res.json({isWhatsAppConnection})
})


router.post('/enviar-mensaje', async(req,res)=>{
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


router.post('/enviar-mensaje-pdf', async(req,res)=>{
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


export default router
