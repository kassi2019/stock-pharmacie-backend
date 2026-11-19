import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();
    appController = app.get<AppController>(AppController);
  });

  it('renvoie le statut OK', () => {
    expect(appController.etat().statut).toBe('OK');
  });
});
