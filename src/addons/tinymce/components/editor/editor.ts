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

import {
    CUSTOM_ELEMENTS_SCHEMA,
    AfterViewInit,
    Component,
    ElementRef,
    OnDestroy,
    ViewChild,
} from '@angular/core';
import { ContextLevel } from '@/core/constants';
import { CoreSharedModule } from '@/core/shared.module';
import { CoreEditorBaseComponent } from '@features/editor/classes/base-editor-component';
import { getEditorOptions } from '@addons/tinymce/utils/config';
import { getTinyMCE } from '../../utils/loader';
import type { Editor } from 'tinymce';

/**
 * Implementation of a rich text editor using TinyMCE.
 *
 * Do not use this component directly. Use <core-rich-text-editor> instead.
 */
@Component({
    selector: 'addon-tinymce-editor',
    templateUrl: 'addon-tinymce-editor.html',
    styleUrls: ['editor.scss'],
    standalone: true,
    imports: [
        CoreSharedModule,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AddonTinyMceEditorComponent extends CoreEditorBaseComponent implements AfterViewInit, OnDestroy {

    protected editor?: Editor;
    protected element: HTMLElement;
    protected textareaElement?: HTMLTextAreaElement;

    @ViewChild('textarea') textarea?: ElementRef<HTMLTextAreaElement>; // Textarea editor.

    constructor(
        elementRef: ElementRef,
    ) {
        super();
        this.element = elementRef.nativeElement;
    }

    /**
     * @inheritdoc
     */
    async onResize(): Promise<void> {
        // Nothing to do.
    }

    /**
     * @inheritdoc
     */
    async ngAfterViewInit(): Promise<void> {
        this.textareaElement = this.textarea?.nativeElement;
        if (!this.textareaElement) {
            return;
        }

        const options = await getEditorOptions({
            target:  this.textareaElement,
            contextLevel: this.contextLevel ?? ContextLevel.SYSTEM,
            instanceId: this.contextInstanceId ?? 0,
            placeholder: this.placeholder,
        });
        const tinyMCE = await getTinyMCE();
        const [editor] = await tinyMCE.init(options);
        this.editor = editor;

        // Listen for changes.
        this.editor.on('Change input', () => {
            this.onChange?.(this.editor?.getContent() ?? '');
        });

        // Disable swiper while scrolling the toolbar.
        this.element.addEventListener('touchstart', (event) => {
            event.stopPropagation();
        });

        this.onReadyPromise.resolve();
    }

    /**
     * @inheritdoc
     */
    setContent(content: string): void {
        if (content === '') {
            content = '<p></p>';
        }
        this.editor?.setContent(content);
    }

    /**
     * @inheritdoc
     */
    ngOnDestroy(): void {
        this.editor?.remove();
    }

}
