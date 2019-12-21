import admin from 'firebase-admin';
import { https } from 'firebase-functions';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

admin.initializeApp();

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const SN_MAPPING = {
  "LZABP-NVOQN-TBGRK-JQUQX": { serialNumber: "LZABP-NVOQN-TBGRK-JQUQX", client: "野村嘉義", numberOfClients: 15 },
  "ILMIW-RRTSW-EYPCI-WYYBR": { serialNumber: "ILMIW-RRTSW-EYPCI-WYYBR", client: "野村台南店 2", numberOfClients: 10 },
  "IWCLG-TSNED-HTCKS-LHHME": { serialNumber: "IWCLG-TSNED-HTCKS-LHHME", client: "野村台南店 3", numberOfClients: 10 },
  "JCOOR-SKFTN-GPEOQ-AQEYL": { serialNumber: "JCOOR-SKFTN-GPEOQ-AQEYL", client: "野村岡山", numberOfClients: 15 },
  "JXRTA-LYJTM-DGZXB-FXJXV": { serialNumber: "JXRTA-LYJTM-DGZXB-FXJXV", client: "野村永康", numberOfClients: 15 }
};

app.all('/', (req, res) => {
  res.send('Printii Service is Alive!');
});

app.all('/registLicense', (req, rep) => {

  let { serialNumber, deviceToken, customerProfile } = req.body;
  let distribution = {
    LicenseDetail: {
      serialNumber: serialNumber || 'UNKNOWN',
      numberOfClients: 10,
    },
  };

  console.log('serial number:', serialNumber);

  if (serialNumber in SN_MAPPING) {
    let distributer = SN_MAPPING[serialNumber];
    distribution.LicenseDetail = distributer;
  }

  let reply = {
    Status: true,
    Message: null,
    Result: distribution,
  };
  rep.header('Content-Type', 'application/json');
  rep.json(reply);
});

app.get('/product.ashx', (req, rep) => {
  // ?action=getproducts&serviceid=:sid
  const serviceid = req.param('serviceid');

  admin
    .database()
    .ref(`services/${serviceid}/products`)
    .once('value')
    .then(snap => snap.val())
    .then(productMap => {
      let response = [];
      for (let key in productMap) {
        response.push(productMap[key]);
      }
      return { response: response };
    })
    .then(response => {
      rep.setHeader('Content-Type', 'application/json');
      rep.json(response);
      return response;
    })
    .catch(e => {
      let response = null;
      if (!serviceid) {
        response = require('./src/store');
      } else {
        response = require(`./src/${serviceid}`);
      }
      rep.setHeader('Content-Type', 'application/json');
      rep.json(response);
    });
});

export const license = https.onRequest(app);