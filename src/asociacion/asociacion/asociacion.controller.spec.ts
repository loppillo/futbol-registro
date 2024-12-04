import { Test, TestingModule } from '@nestjs/testing';
import { AsociacionController } from './asociacion.controller';
import { AsociacionService } from './asociacion.service';

describe('AsociacionController', () => {
  let controller: AsociacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsociacionController],
      providers: [AsociacionService],
    }).compile();

    controller = module.get<AsociacionController>(AsociacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
