import { Test, TestingModule } from '@nestjs/testing';
import { PromotionalCodesService } from './promotional-codes.service';

describe('PromotionalCodesService', () => {
  let service: PromotionalCodesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromotionalCodesService],
    }).compile();

    service = module.get<PromotionalCodesService>(PromotionalCodesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
