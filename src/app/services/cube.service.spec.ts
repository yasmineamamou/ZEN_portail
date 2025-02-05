import { TestBed } from '@angular/core/testing';

import { CubeService } from './cube.service';

describe('CubeService', () => {
  let service: CubeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CubeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
