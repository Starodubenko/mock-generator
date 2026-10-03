import { Injectable } from '@nestjs/common';
import {
  ActivateProfileHandler,
  ActivateProfileResult,
} from '../activate-profile/activate-profile.handler';

@Injectable()
export class RollbackProfileHandler {
  constructor(private readonly activateProfile: ActivateProfileHandler) {}

  execute(command: {
    documentType: string;
    contour: string;
    versionId: string;
  }): Promise<ActivateProfileResult> {
    return this.activateProfile.execute({
      ...command,
      requirePreviouslyActive: true,
    });
  }
}
