import { Test, TestingModule } from '@nestjs/testing';
import { AsociacionService } from './asociacion.service';

describe('AsociacionService', () => {
  let service: AsociacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AsociacionService],
    }).compile();

    service = module.get<AsociacionService>(AsociacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
