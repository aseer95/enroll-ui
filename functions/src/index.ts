import * as functions from 'firebase-functions';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

export const agencies = functions.https.onRequest((_req, res) => {
  res.status(200).send([
    {
      agencyName: 'XYZ Agency Inc.',
    },
    {
      agencyName: 'Bobs Brokers',
    },
    {
      agencyName: 'BlueFin Financial',
    },
  ]);
});

export const agencyStaff = functions.https.onRequest((_req, res) => {
  res.status(200).send([
    {
      staffName: 'Bob Jones',
    },
    {
      staffName: 'Frank Dart',
    },
    {
      staffName: 'Jessica Sanders',
    },
  ]);
});

export const primaryAgents = functions.https.onRequest((_req, res) => {
  res.status(200).send([
    {
      staffName: 'Broker Bob',
    },
    {
      staffName: 'Broker Dan',
    },
    {
      staffName: 'Broker Rishi',
    },
  ]);
});
