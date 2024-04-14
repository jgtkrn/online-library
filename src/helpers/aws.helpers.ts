import * as aws from 'aws-sdk';
import * as path from 'path';
import * as fs from 'fs';

export class AwsModule {

  async assetsName(rawName){
    const specialChar  = /[`!@#$%^&*()+\=\[\]{};':"\\|,<>\/?~]/;
    let name = rawName
      if (specialChar.test(name)) {
        name = `assets_${Math.random().toString(36)}${path.extname(rawName)}`
      }
    return name
    
  }

  async getAudio(key: string): Promise<any> {
    const s3bucket = new aws.S3({
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      region: process.env.REGION,
    });

    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: `${key}`,
    };

    return new Promise((resolve, reject) => {
      s3bucket.getObject(params, function (err, data) {
        if (err) {
          return reject(err);
        }

        return resolve(data);
      });
    });
  }

  async removeAudio(key: string): Promise<any> {
    const s3bucket = new aws.S3({
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      region: process.env.REGION,
    });

    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: `${key}`,
    };

    return new Promise((resolve, reject) => {
      s3bucket.deleteObject(params, function (err, data) {
        if (err) {
          return reject(err);
        }

        return resolve(data);
      });
    });
  }

  async uploadAudio(
    originalname: string,
    buffer: string
  ): Promise<object | null> {

    const s3bucket = new aws.S3({
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      region: process.env.REGION,
    });
  
    const params = {
      ACL: 'public-read',
      Bucket: process.env.BUCKET_NAME,
      Body: buffer,
      Key: `${await this.assetsName(originalname)}`,
    };

    return new Promise((resolve, reject) => {
      s3bucket.upload(params, function (err, data) {
        if (err) {
          return reject(err);
        }

        return resolve(data);
      });
    });
  }

  async convertTextToSpeech(chapter_label: string, chapter: string, language: string): Promise<any>{
    const s3bucket = new aws.S3({
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      region: process.env.REGION,
    });
    const Polly = new aws.Polly({
      signatureVersion: "v4",
      region: "ap-southeast-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    let voice_id = "Hiujin";
    let language_code = "yue-CN";

    if(language == 'MN' || language == 'zh-TW') {
      voice_id = "Zhiyu";
      language_code = "cmn-CN";
    }

    if(language == "EN") {
      voice_id = "Joanna";
      language_code = "en-US";
    }

    let params = {
      Text: chapter.replace( /(<([^>]+)>)/ig, ''),
      OutputFormat: "mp3",
      VoiceId: voice_id,
      LanguageCode: language_code,
      Engine: 'neural'
    };

    Polly.synthesizeSpeech(params, (err, data) => {
      if (err) {
        console.log(err);
      } else if (data) {
        if (data.AudioStream instanceof Buffer) {
              const audioparams = {
                ACL: 'public-read',
                Bucket: process.env.BUCKET_NAME,
                Body: data.AudioStream,
                Key: `${chapter_label}`,
                ContentType: 'audio/mp3'
              };
          return new Promise((resolve, reject) => {
            s3bucket.upload(audioparams, function (err, result) {
              if (err) {
                return reject(err);
              }

              return resolve(result);
            });
          });
        }
      }
    });
  }
}

export default new AwsModule();