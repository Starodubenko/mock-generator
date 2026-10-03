import { assertOperatorHelpSafe } from '@frontend/shared/ui/markdown-view/assert-operator-help-safe';
import { homeHelp } from './home/config/help';
import { trainHelp } from './train/config/help';
import { versionHelp } from './version/config/help';
import { generateHelp } from './jobs/config/generate-help';
import { jobsHelp } from './jobs/config/jobs-help';
import { jobHelp } from './jobs/config/job-help';
import { quarantineHelp } from './jobs/config/quarantine-help';
import { documentTypesHelp } from './document-types/config/help';
import { mocksHelp } from './mocks/config/help';

describe('operator guides', () => {
  it('should_keep_console_help_safe_and_complete', () => {
    assertOperatorHelpSafe(homeHelp('test-stand'));
    assertOperatorHelpSafe(trainHelp('test-stand'));
    assertOperatorHelpSafe(versionHelp('test-stand'));
    assertOperatorHelpSafe(documentTypesHelp('test-stand'));
    assertOperatorHelpSafe(generateHelp('test-stand'));
    assertOperatorHelpSafe(jobsHelp('test-stand'));
    assertOperatorHelpSafe(jobHelp('job-1'));
    assertOperatorHelpSafe(jobHelp('job-1', 'train'));
    assertOperatorHelpSafe(quarantineHelp());
    assertOperatorHelpSafe(mocksHelp('test-stand'));
  });
});
