// (C) Copyright 2015 Moodle Pty Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { CoreFile } from '@services/file';
import { Translate } from '@singletons';
import { CorePath } from '@singletons/path';
import { setupScanQR } from '../plugins/scanqr';
import type { TinyMCE } from 'tinymce';

/**
 * Get base URL of TinyMCE.
 *
 * @returns The base URL.
 */
export function getBaseURL(): string {
    const wwwPath = CoreFile.getWWWPath();

    return CorePath.concatenatePaths(wwwPath, '/assets/lib/tinymce');
}

/** Promise for TinyMCE API object. */
let tinyPromise: Promise<TinyMCE> | undefined;

/**
 * Get the TinyMCE API Object.
 *
 * @returns The TinyMCE API Object
 */
export function getTinyMCE(): Promise<TinyMCE> {
    if (tinyPromise) {
        return tinyPromise;
    }

    tinyPromise = new Promise((resolve, reject) => {
        let script = document.head.querySelector<HTMLScriptElement>('script[data-tinymce="tinymce"]');
        if (script) {
            resolve(window['tinyMCE']);

            return;
        }

        script = document.createElement('script');
        script.dataset.tinymce = 'tinymce';
        script.src = CorePath.concatenatePaths(getBaseURL(), 'tinymce.min.js');
        script.async = true;
        script.onload = () => {
            resolve(window['tinyMCE']);
        };
        script.onerror = () => {
            reject('Error loading TinyMCE.');
        };

        document.head.append(script);
    }).then((tinyMCE: TinyMCE) => {
        // Setup plugins.
        setupScanQR(tinyMCE);

        return tinyMCE;
    });

    return tinyPromise;
}

/**
 * Load language strings for TinyMCE.
 *
 * Based on Moodle's lib/editor/tiny/lang.php.
 *
 * @param lang Language to load.
 */
export async function loadLanguageStrings(lang: string): Promise<void> {
  const [tinyMCE, originalStrings] = await Promise.all([getTinyMCE(), import('./tinystrings.json')]);

  const strings = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      __dir: Translate.instant('core.thisdirection'),
  };

  for (const key in originalStrings) {
      const originalString = originalStrings[key];
      const translatedString = Translate.instant('addon.tinymce.' + key);
      if (originalString !== translatedString) {
           strings[originalString] = translatedString;
      }
  }

  tinyMCE.addI18n(lang, strings);
}
