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

import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core';
import { CoreSharedModule } from '@/core/shared.module';
import { CoreConfig } from '@services/config';
import { ADDON_TINYMCE_SETTING } from '@addons/tinymce/services/editor';

/**
 * Component to display the TinyMCE setting.
 */
@Component({
  selector: 'addon-tinymce-setting',
  templateUrl: 'addon-tinymce-setting.html',
  standalone: true,
  imports: [
      CoreSharedModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AddonTinyMceSettingComponent implements OnInit {

    enabled = false;

    async ngOnInit(): Promise<void> {
          this.enabled = await CoreConfig.get(ADDON_TINYMCE_SETTING, false);
    }

    /**
     * Called when the TinyMCE editor is enabled or disabled.
     */
    enabledChanged(): void {
        CoreConfig.set(ADDON_TINYMCE_SETTING, this.enabled ? 1 : 0);
    }

}
