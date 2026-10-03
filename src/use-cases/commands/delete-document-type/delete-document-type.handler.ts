import { Inject, Injectable } from '@nestjs/common';
import { DomainHttpException } from '@app/domain-http.exception';
import { PROCESS_STORE, ProcessStore } from '@repositories/process-store.port';

export type DeleteDocumentTypeCommand = {
  documentType: string;
};

@Injectable()
export class DeleteDocumentTypeHandler {
  constructor(
    @Inject(PROCESS_STORE)
    private readonly store: ProcessStore,
  ) {}

  async execute(
    command: DeleteDocumentTypeCommand,
  ): Promise<{ documentType: string }> {
    if (!(await this.store.hasDocumentType(command.documentType))) {
      throw new DomainHttpException(
        404,
        'missing_required',
        'Тип документа не найден',
        '',
      );
    }
    await this.store.deleteDocumentType(command.documentType);
    return { documentType: command.documentType };
  }
}
