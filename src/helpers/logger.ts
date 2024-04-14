const winston = require('winston');
var CoralogixWinston = require("coralogix-logger-winston");
const { combine, timestamp, label, prettyPrint } = winston.format;
const logDir = 'logs';
const fs = require('fs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
 }
     
// global configuration for coralogix 
var config = {
    privateKey: process.env.CORALOGIX_PRIVATE_KEY,
    applicationName: process.env.CORALOGIX_APPLICATION_NAME,
    subsystemName: `${process.env.CORALOGIX_SUBSYSTEM_NAME}`,
};
 
CoralogixWinston.CoralogixTransport.configure(config);

 const myFormat = prettyPrint(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
  });

  let transports = [
      new CoralogixWinston.CoralogixTransport({
      category: process.env.CORALOGIX_SUBSYSTEM_NAME,
      handleExceptions: true}),

    new(require('winston-daily-rotate-file'))({
      filename: `${logDir}/${process.env.SCHEMA}-error.log`,
      timestamp: true,
      datePattern: 'DD-MM-yyyy',
      prepend: true,
      json: false,
      level: 'error'
  }),

    new(require('winston-daily-rotate-file'))({
        filename: `${logDir}/${process.env.SCHEMA}-info.log`,
        timestamp: true,
        datePattern: 'DD-MM-yyyy',
        prepend: true,
        json: false,
        level: process.env.MODE === 'development' ? 'verbose' : 'info'
    }),

  ]
  if(process.env.NODE_ENV === 'development') {
    transports =   new winston.transports.Console()
  }
  winston.configure({
      format: combine(
          label({ label: process.env.SCHEMA }),
          timestamp(),
          myFormat,
      ),
      transports: transports
});

export const Logger = winston;

