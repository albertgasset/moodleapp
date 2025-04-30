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

import { Injectable, Type } from '@angular/core';
import { CoreEditorBaseComponent } from '@features/editor/classes/base-editor-component';
import { CoreEditorServiceProvider } from '@features/editor/services/editor';
import { CoreConfig } from '@services/config';

export const ADDON_TINYMCE_SETTING = 'AddonTinyMceEditor';

/**
 * Service to override the default rich text editor.
 */
@Injectable( { providedIn: 'root' })
export class AddonTinyMceEditorServiceProvider extends CoreEditorServiceProvider {

    /**
     * @inheritdoc
     */
    async getAboutComponentClass(): Promise<Type<unknown> | undefined> {
        const module = await import('@/addons/tinymce/components/about/about');

        return module.AddonTinyMceAboutComponent;
    }

    /**
     * @inheritdoc
     */
    async getEditorComponentClass(): Promise<Type<CoreEditorBaseComponent>> {
        const enabled = await CoreConfig.get(ADDON_TINYMCE_SETTING, false);
        if (enabled) {
            const module = await import('@/addons/tinymce/components/editor/editor');

            return module.AddonTinyMceEditorComponent;
        } else {
            return super.getEditorComponentClass();
        }
    }

    /**
     * @inheritdoc
     */
    async getSettingsComponentClass(): Promise<Type<unknown> | undefined> {
        const module = await import('@/addons/tinymce/components/setting/setting');

        return module.AddonTinyMceSettingComponent;
    }

}
