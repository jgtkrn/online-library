import { NestFactory } from '@nestjs/core'
import { configService } from './config/config.service'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './modules/app/app.module'
import { ValidationPipe, ValidationError, BadRequestException } from '@nestjs/common';
import { Logger } from '../src/helpers/logger'
import * as bodyParser from 'body-parser';

async function bootstrap() {

  // FIXME: please find better solution
  process.setMaxListeners(100);

  const app = await NestFactory.create(AppModule, {
    logger: Logger
  });
  // app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  if (process.env.GLOBAL_PREFIX) {
    app.setGlobalPrefix(process.env.GLOBAL_PREFIX);
  }
  app.use(bodyParser.json({limit: '100mb'}));
  app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));
  app.enableCors(); // to enable cors
  app.useGlobalPipes(
    new ValidationPipe({
      skipMissingProperties: false,
      exceptionFactory: (errors: ValidationError[]) => {
        Logger.error(errors);
        return new BadRequestException({error: [errors[0].constraints], success: false, message: "Bad Request"});
      },
    }),
  );

  const options = new DocumentBuilder()
  .setTitle('DotDotRead API')
  .setDescription('The DotDotRead API description')
  .setVersion('1.0')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    'access-token',
  )
  .build();

const document = SwaggerModule.createDocument(app, options);
SwaggerModule.setup('doc', app, document);
  await app.listen(configService.getPort());
}
bootstrap();
