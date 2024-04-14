import { Test, TestingModule } from '@nestjs/testing';
import { PromotionalCodesController } from './promotional-codes.controller';

describe('PromotionalCodesController', () => {
  let controller: PromotionalCodesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromotionalCodesController],
    }).compile();

    controller = module.get<PromotionalCodesController>(PromotionalCodesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
