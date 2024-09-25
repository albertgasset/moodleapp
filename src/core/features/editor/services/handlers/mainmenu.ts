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

import { Injectable } from '@angular/core';
import { CoreMainMenuHandler, CoreMainMenuHandlerToDisplay } from '@features/mainmenu/services/mainmenu-delegate';
import { makeSingleton } from '@singletons';

/**
 * Handler to inject an option into main menu.
 */
@Injectable({ providedIn: 'root' })
export class CoreEditorTinyDemoMainMenuHandlerService implements CoreMainMenuHandler {

    static readonly PAGE_NAME = 'tiny-demo';

    name = 'CoreEditorTinyDemo';

    /**
     * Check if the handler is enabled on a site level.
     *
     * @returns Whether or not the handler is enabled on a site level.
     */
    isEnabled(): Promise<boolean> {
        return Promise.resolve(true);
    }

    /**
     * Returns the data needed to render the handler.
     *
     * @returns Data needed to render the handler.
     */
    getDisplayData(): CoreMainMenuHandlerToDisplay {
        return {
            icon: 'fas-flask',
            title: 'TinyMCE demo',
            page: CoreEditorTinyDemoMainMenuHandlerService.PAGE_NAME,
            class: 'core-editor-tiny-demo-handler',
        };
    }

}

export const CoreEditorTinyDemoMainMenuHandler = makeSingleton(CoreEditorTinyDemoMainMenuHandlerService);
