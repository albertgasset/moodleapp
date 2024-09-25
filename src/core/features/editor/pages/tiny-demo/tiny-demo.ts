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

import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

/**
 * Page that displays a Tiny editor demo.
 */
@Component({
    selector: 'page-core-editor-tiny-demo',
    templateUrl: 'tiny-demo.html',
})
export class CoreEditorTinyDemoPage {

    form = new FormGroup({
        content: new FormControl<string>(
            '<p>Testing <strong>TinyMCE</strong> in the Moodle app.</p>',
            {
                nonNullable: true,
                validators: [Validators.required],
            },
        ),
    });

}
