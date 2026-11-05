/**
 * The folio — kiruk's landing, one sheet made on a wireframe.
 * Plates are server-rendered and complete; the client adds the paper,
 * the light, the scrub and the margin's live numbers.
 *
 * spec-link: ideas/studio-dawn/folio.md
 */
import { FolioClient } from './FolioClient';
import { LogogramDefs } from './ink/logogram';
import { Margin } from './Margin';
import { FolioIndex } from './plates/FolioIndex';
import { PlateDesirable } from './plates/PlateDesirable';
import { PlateKiruk } from './plates/PlateKiruk';

export function Folio() {
  return (
    <div className="folio">
      <FolioClient />
      <svg className="defs" width="0" height="0" aria-hidden="true" focusable="false">
        <defs>
          <LogogramDefs />
        </defs>
      </svg>
      <div className="folio-grid">
        <main className="folio-main">
          <PlateKiruk />
          <PlateDesirable />
          <FolioIndex />
        </main>
        <Margin />
      </div>
    </div>
  );
}
