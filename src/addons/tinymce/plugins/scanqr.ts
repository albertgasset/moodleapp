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

import { CoreQRScan } from '@services/qrscan';
import { Translate } from '@singletons';
import type { TinyMCE } from 'tinymce';

/**
 * Setup Scan QR plugin.
 */
export function setupScanQR(tinyMCE: TinyMCE): void {
    tinyMCE.PluginManager.add('moodleapp/scanqr', (editor) => {
        editor.ui.registry.addIcon('scanqr', '<ion-icon name="fas-qrcode" aria-hidden="true" />');

        const title = Translate.instant('core.scanqr');

        const onAction = async () => {
            const text = await CoreQRScan.scanQR();
            if (text) {
                editor.selection.setContent(text);
            }
        };

        editor.ui.registry.addButton('scanqr', {
            icon: 'scanqr',
            tooltip: title,
            onAction,
        });

        editor.ui.registry.addMenuItem('scanqr', {
            icon: 'scanqr',
            text: title,
            onAction,
        });
    });
}
